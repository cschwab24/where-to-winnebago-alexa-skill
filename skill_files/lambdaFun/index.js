'use strict';
var http = require('http');

exports.handler = function(event,context) {
  try {
    if (process.env.NODE_DEBUG_EN) {console.log("Request:\n"+JSON.stringify(event,null,2));}
    var request = event.request;
    var session = event.session;
    if(!event.session.attributes) {event.session.attributes = {};}

    if (request.type === "LaunchRequest") {
      handleLaunchRequest(context);
    } else if (request.type === "IntentRequest") {
      if (request.intent.name === "PickStateIntent") {
        handlePickStateIntent(request,context,session);
      } else if (request.intent.name === "NhPlaceIntent") {
        handleNhPlaceIntent(request,context,session);
      } else if (request.intent.name === "CaActivityIntent") {
        handleCaActivityIntent(request,context,session);
      } else if (request.intent.name === "MoreInfoIntent") {
        handleMoreInfoIntent(request,context,session);
      } else if (request.intent.name === "BackIntent") {
        handleBackIntent(request,context,session);
      } else if (request.intent.name === "StartOverIntent") {
        handleStartOverIntent(request,context,session);
      } else if (request.intent.name === "AMAZON.StopIntent" || request.intent.name === "AMAZON.CancelIntent") {
        context.succeed(buildResponse({
          speechText: "Good bye. ",
          endSession: true
        }));
      } else {
        throw "Unknown intent";
      }
    } else if (request.type === "SessionEndedRequest") {
      // do nothing
    } else {
      throw "Unknown intent type";
    }
  } catch(e) {
    context.fail("Exception: "+e);
  }
} // end exports.handler

function buildResponse(options) {
  if(process.env.NODE_DEBUG_EN) {
    console.log("buildResponse options:\n"+JSON.stringify(options,null,2));
  }
  var response = {
    version: "1.0",
    response: {
      outputSpeech: {
        type: "SSML",
        ssml: "<speak>"+options.speechText+"</speak>"
      },
      shouldEndSession: options.endSession
    }
  };
  if(options.repromptText) {
    response.response.reprompt = {
      outputSpeech: {
        type: "SSML",
        ssml: "<speak>"+options.repromptText+"</speak>"
      }
    };
  }
  if(options.cardTitle) {
    response.response.card = {
      type: "Simple",
      title: options.cardTitle
    }
    if(options.imageUrl) {
      response.response.card.type = "Standard";
      response.response.card.text = options.cardContent;
      response.response.card.image = {
        smallImageUrl: options.imageUrl,
        largeImageUrl: options.imageUrl
      };
    } else {
      response.response.card.content = options.cardContent;
    }
  }
  if(options.session && options.session.attributes) {
    response.sessionAttributes = options.session.attributes;
  }
  if(process.env.NODE_DEBUG_EN) {
    console.log("Response:\n"+JSON.stringify(response,null,2));
  }
  return response;
}

function handleLaunchRequest(context) {
  let options = {};
  options.speechText =  "Hello, welcome to Where-to Winnebago! Let’s get you started on your next adventure. You can respond back to return to the previous question or start over to start a new adventure. First let’s pick a state. Would you rather explore New Hampshire or California?";
  options.repromptText = "Would you rather explore New Hampshire or California?";
  options.endSession = false;
  context.succeed(buildResponse(options));
}

function handlePickStateIntent(request,context,session) {
  let options = {};
  let state = request.intent.slots.State.value;
  let lc_State = state.toLowerCase();
  options.session = session;
  switch(lc_State){
    case 'new hampshire':
      options.speechText = "Great, we think the granite state is pretty cool too. Would you like to hike a mountain or visit the seacoast?";
      options.imageUrl = "https://www.rocketbanner.com/images/states/new-hampshire/new-hampshire-vinyl-banners.jpg";
      options.session.attributes.currentstate = "new hampshire";
      break;
    case 'california':
      options.speechText = "Okay, are you interested in family friendly activities or adults only?";
      options.imageUrl = "https://cdn.history.com/sites/2/2015/09/GettyImages-501880463.jpg";
      options.session.attributes.currentstate = "california";
      break;
    default:
      options.speechText = "Please choose from either California or New Hampshire for this prototype.";
      options.imageUrl = "";
      options.session.attributes.currentstate = "";
  }
  options.cardTitle = "Adventure Time!"
  options.cardContent = `Let's go to ${state}!`;
  options.endSession = false;
  context.succeed(buildResponse(options));
}

function handleNhPlaceIntent(request,context,session) {
  let options = {};
  let nh_place = request.intent.slots.NhPlace.value;
  options.session = session;
  if (nh_place == 'hike' || nh_place == 'hike a mountain') {
    options.speechText = "We suggest Mount Washington, the tallest peak east of the Mississippi. This mountain has an elevation of 6,289 feet and is home to some of the world’s wildest weather. To learn more say stay, food, or info.";
    options.session.attributes.nhplace = "hike";
  } else if (nh_place == 'seacoast' || nh_place == 'visit the seacoast') {
    options.speechText = "We recommend the Wakeda Campground located in Hampton Falls. It’s close to the beaches and a short drive from our home, the bustling seaside town of Portsmouth, NH.  An adventure card has been sent with the address, phone number, and additional information. To explore this region say eat, drink, or fun fact";
    options.cardTitle = "Wakeda Campground";
    options.cardContent = "http://www.wakedacampground.com/\n294 Exeter Rd, Hampton Falls, NH 03844 \n603-772-5274";
    options.session.attributes.nhplace = "seacoast";
  }
  options.endSession = false;
  context.succeed(buildResponse(options));
}

function handleCaActivityIntent(request,context,session) {
  let options = {};
  let ca_activity = request.intent.slots.CaActivity.value;
  options.session = session;
  if (ca_activity == 'family' || ca_activity == 'family friendly') {
    options.speechText = "Everyone loves Disneyland, right? The closest place to park your RV near Disneyland is less than two miles away at the Anaheim RV Park. An adventure card has been sent with an address, phone number, and additional information.";
    options.cardTitle = "Disneyland"
    options.cardContent = "www.anaheimrvpark.com\n200 W Midway Dr\nAnaheim, CA 92805\n714-774-3860";
    options.session.attributes.caactivity = "family";
  } else if (ca_activity == 'adults' || ca_activity == 'adults only') {
    options.speechText = "Are you looking for a thrill or would you rather unwind?";
    options.session.attributes.caactivity = "adult";
  }
  options.endSession = false;
  context.succeed(buildResponse(options));
}

function handleMoreInfoIntent(request,context,session) {
  let options = {};
  options.session = session;
  let action = request.intent.slots.MoreInfo.value;
  let currentstate = options.session.attributes.currentstate;
  let nhplace = options.session.attributes.nhplace;
  let caactivity = options.session.attributes.caactivity;
  if (currentstate == 'new hampshire') {
    if (nhplace == 'hike') {
      switch(action){
        case 'stay':
          options.speechText = "You can stay at the nearby Twin Mountain KOA campground. An adventure card has been sent with an address, phone number, and additional information. To learn more say food or info";
          options.cardTitle = "Twin Mountain KOA campground"
          options.cardContent = "Amenities:\n\u202250 AMP Max\n\u202290’ Max Length\n\u2022Wi-Fi\n\u2022Cable TV\n\u2022Pool\n\u2022Dog Park\n\u2022Game Room\n\u2022General Store\nhttp://koa.com/campgrounds/twin-mountain/\n372 NH-115\nCarroll, NH 03598\n603-846-5559";
          options.imageUrl = "https://media.mobilerving.com/mobilerving/uploads/14363/1431526517.jpg";
          break;
        case 'food':
          options.speechText = "Grab a bite to eat at Munroe’s Family Restaurant. It has good food, generous portion sizes, and great prices. An adventure card has been sent with address, phone number, and additional information. To learn more say stay or info";
          options.cardTitle = "Munroe’s Family Restaurant"
          options.cardContent = "633 US-3\nTwin Mountain, NH 03595\n603-846-5542\nhttps://www.yelp.com/biz/munroes-family-restaurant-twin-mountain";
          options.imageUrl = "https://sectionhiker.com/wp-content/uploads/thumbskeep/2012/11/1-P1020542.jpg";
          break;
        case 'info':
          options.speechText = "Don’t forget to fuel up before entering the White Mountain National Forest. We’ve sent you an adventure card that shows nearby gas stations as well as our preferred hikes and area activities. To learn more say stay or food";
          options.cardTitle = "Preferred Hikes and Area Activities"
          options.cardContent = "1598 Mt Washington Auto Rd\nSargent's Purchase, NH\n603-466-3347\nAMC Guide:\n\u2022http://www.outdoors.org/trip-ideas-tips-resources/plan-your-trip/nh-4000-footers/hiking-mount-washington.cfm\nNearby Hike: Franconia Ridge Trail\n\u2022https://www.alltrails.com/trail/us/new-hampshire/mount-lafayette-and-franconia-ridge-trail-loop";
          options.imageUrl = "https://www.hikeformentalhealth.org/wp-content/uploads/2012/09/Mt-Washington-Descent.jpg";
          break;
        default:
          options.speechText = "To learn more say stay, food, or info. You can also say start over to begin a new adventure.";
      }
    } else if (nhplace == 'seacoast') {
      switch(action){
        case 'eat':
          options.speechText = "Enjoy a waterfront dining experience at the River House Restaurant in downtown Portsmouth. Might we recommend the award-winning clam chowder. An adventure card has been sent to you with the address, phone number, and additional information. To learn more say drink or fun fact";
          options.cardTitle = "River House Restaurant"
          options.cardContent = "https://riverhouse53bow.com/\n53 Bow St\nPortsmouth, NH 03801\n603-431-2600";
          options.imageUrl = "https://media-cdn.tripadvisor.com/media/photo-s/04/cb/f6/c2/the-river-house.jpg";
          break;
        case 'drink':
          options.speechText = "For our adult crowd, savor a hoppy beer at Liar’s Bench Brewing Company in Portsmouth, NH. Saltwater produced the Liar’s Bench brand video included in the adventure card we just sent. To learn more say eat or fun fact";
          options.cardTitle = "Liar’s Bench Brewing"
          options.cardContent = "https://vimeo.com/174109753\n\nhttp://www.liarsbenchbeer.com/ \n459 Islington St #4\nPortsmouth, NH 03801\n603-294-9156";
          options.imageUrl = "https://static1.squarespace.com/static/56b0c7ce3c44d81dc1d117be/t/5727e11c8a65e2a723efaa01/1462231335813/";
          break;
        case 'fun fact':
          options.speechText = "Saltwater Creative was born on the seacoast with a love for salty water and innovative marketing. We live and breathe digital campaigns, web development, design, marketing technology, video and more. Check out the adventure card we just sent to get in touch. To learn more say eat or drink";
          options.cardTitle = "Saltwater Creative"
          options.cardContent = "www.saltwaterco.com\n40 Congress St., Portsmouth, NH 03801\n617-519-8503 (Tony Barnea - Director of Marketing Strategy)";
          options.imageUrl = "https://media.licdn.com/media/AAEAAQAAAAAAAAQCAAAAJGI1MjFmNmM4LWNlOTYtNDBlZi05MDdmLTRjMGU2ODlmMTVhZg.png";
          break;
        default:
          options.speechText = "To learn more say eat, drink, or fun fact. You can also say start over to begin a new adventure.";
      }
    }
  } else if (currentstate == 'california'){
    if (caactivity == 'family') {
      switch(action){
        case '':
          options.speechText = "";
          options.cardTitle = ""
          options.cardContent = "";
          break;
        default:
          options.speechText = "To learn more say";
      }
    } else if (caactivity == 'adult') {
      switch(action){
        case 'thrill':
          options.speechText = "Rad! Drive your Winnebago over to the American River Resort. This resort also offers white water rafting excursions as one of their amenities. An adventure card has been sent to you with and address, phone number and additional information.";
          options.cardTitle = "American River Resort"
          options.cardContent = "http://www.americanriverresort.com/\n6019 New River Road\nColoma, CA 95613\n530-622-6700";
          options.imageUrl = "https://offthegridwithcathyherman.files.wordpress.com/2011/05/001.jpg";
          break;
        case 'unwind':
          options.speechText = "Pour yourself a tall glass of rest and relaxation in Sonoma County. The Casini Ranch campground is just moments away from some of the region's best wineries. An info card has been sent to you with the address, phone number and additional information. To have a list of the top 10 wineries near this campground sent to you say pour.";
          options.cardTitle = "Casini Ranch Family Campground"
          options.cardContent = "http://www.winecountrykoa.com/\n22855 Moscow Road\nDuncans Mills, CA 95430\n800-451-8400";
          options.imageUrl = "https://static1.squarespace.com/static/5755d7f022482e6896b3783e/t/576dbf9b9f7456eedf7faf56/1466810297084/Ranch+map?format=750w";
          break;
        case 'pour':
          options.speechText = "Check your alexa app for a top 10 info card";
          options.cardTitle = "Top 10 Wineries Near Casini Ranch Family Campground"
          options.cardContent = "https://www.yelp.com/search?cflt=wineries&find_near=casini-ranch-family-campground-duncans-mills";
          options.imageUrl = "https://scontent-lga3-1.xx.fbcdn.net/v/t1.0-9/19884353_10155388820036877_5836337049282863889_n.jpg?oh=4b59fe20adde4b1097606d0eee62d7c9&oe=5A4A3741";
          break;
        default:
          options.speechText = "Please say thrill or unwind. You can also say start over to begin a new adventure.";
      }
    }
  }
  options.endSession = false;
  context.succeed(buildResponse(options));
}

function handleBackIntent(request,context,session) {
  let options = {};
  options.session = session;
  let currentstate = options.session.attributes.currentstate;
  let nhplace = options.session.attributes.nhplace;
  let caactivity = options.session.attributes.caactivity;
  if (currentstate !== '') {
    // we have picked a state
    if (nhplace !== '') {
      // we have picked a new hampshire place
      options.speechText = "Would you like to hike a mountain or visit the seacoast?";
      options.session.attributes.currentstate = "new hampshire";
      options.session.attributes.nhplace = "";
    } else if (caactivity !== '') {
      // we have picked a california activity
      options.speechText = "Are you interested in family friendly activities or adults only?";
      options.session.attributes.currentstate = "california";
      options.session.attributes.caactivity = "";
    } else {
      // we have picked a state, but have not picked a place/activity :: start over
      options.speechText =  "Let’s get you started on your next adventure. First let’s pick a state. Would you rather explore New Hampshire or California?";
      options.repromptText = "Would you rather explore New Hampshire or California?";
      options.session.attributes.currentstate = "";
      options.session.attributes.nhplace = "";
      options.session.attributes.caactivity = "";
    }
  } else {
    // we have not picked a state :: start over
    options.speechText =  "Let’s get you started on your next adventure. First let’s pick a state. Would you rather explore New Hampshire or California?";
    options.repromptText = "Would you rather explore New Hampshire or California?";
    options.session.attributes.currentstate = "";
    options.session.attributes.nhplace = "";
    options.session.attributes.caactivity = "";
  }
  options.endSession = false;
  context.succeed(buildResponse(options));
}

function handleStartOverIntent(request,context,session) {
  let options = {};
  options.session = session;
  options.speechText =  "Let’s get you started on your next adventure. First let’s pick a state. Would you rather explore New Hampshire or California?";
  options.repromptText = "Would you rather explore New Hampshire or California?";
  options.session.attributes.currentstate = "";
  options.session.attributes.nhplace = "";
  options.session.attributes.caactivity = "";
  options.endSession = false;
  context.succeed(buildResponse(options));
}

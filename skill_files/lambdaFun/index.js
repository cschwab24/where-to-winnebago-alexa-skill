'use strict';

var http = require('http');

exports.handler = function(event,context) {

  try {

    if(process.env.NODE_DEBUG_EN) {
      console.log("Request:\n"+JSON.stringify(event,null,2));
    }

    var request = event.request;
    var session = event.session;

    if(!event.session.attributes) {
      event.session.attributes = {};
    }

    if (request.type === "LaunchRequest") {
      handleLaunchRequest(context);
    } else if (request.type === "IntentRequest") {
      if (request.intent.name === "PickStateIntent") {
        handlePickStateIntent(request,context);
      } else if (request.intent.name === "NhPlaceIntent") {
        handleNhPlaceIntent(request,context,session);
      } else if (request.intent.name === "CaActivityIntent") {
        handleCaActivityIntent(request,context,session);
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

function handlePickStateIntent(request,context) {
  let options = {};
  let state = request.intent.slots.State.value;
  let lc_State = state.toLowerCase();
  if (lc_State == 'new hampshire' || state == 'california'){
    // options.speechText = `Let's go to ${state}`;
  }
  switch(lc_State){
    case 'new hampshire':
      options.speechText = "Great, we think the granite state is pretty cool too. Would you like to hike a mountain or visit the seacoast?";
      options.imageUrl = "https://www.rocketbanner.com/images/states/new-hampshire/new-hampshire-vinyl-banners.jpg";
      break;
    case 'california':
      options.speechText = "Okay, are you interested in family friendly activities or adults only?";
      options.imageUrl = "https://cdn.history.com/sites/2/2015/09/GettyImages-501880463.jpg";
      break;
    default:
      options.speechText = "Please choose from either California or New Hampshire for this prototype.";
      options.imageUrl = "";
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
    options.speechText = "Great, we’d suggest Mount Washington, the tallest peak east of the Mississippi. This mountain has an elevation of 6,289 feet and is home to some of the world’s wildest weather. You can stay at the nearby Twin Mountain KOA campground. An adventure card has been sent with an address, phone number, and additional information.";
    options.cardTitle = "Twin Mountain KOA campground"
    options.cardContent = "Amenities:\n\u202250 AMP Max\n\u202290’ Max Length\n\u2022Wi-Fi\n\u2022Cable TV\n\u2022Pool\n\u2022Dog Park\n\u2022Game Room\n\u2022General Store\nhttp://koa.com/campgrounds/twin-mountain/\n372 NH-115\nCarroll, NH 03598\n(603) 846-5559";
  } else if (nh_place == 'seacoast' || nh_place == 'visit the seacoast') {
    options.speechText = "Great, we recommend the Wakeda Campground located in Hampton Falls. It’s close to the beaches and a short drive from our home, the bustling seaside town of Portsmouth, NH.  An adventure card has been sent with the address, phone number, and additional information.";
    options.cardTitle = "Wakeda Campground";
    options.cardContent = "http://www.wakedacampground.com/ \n 294 Exeter Rd, Hampton Falls, NH 03844 \n (603) 772-5274";
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
    options.cardContent = "www.anaheimrvpark.com\n200 W Midway Dr\nAnaheim, CA 92805\n(714) 774-3860";
  } else if (ca_activity == 'adults' || ca_activity == 'adults only') {
    options.speechText = "Rad! Drive your Winnebago over to the American River Resort. This resort also offers white water rafting excursions as one of their amenities. An adventure card has been sent to you with and address, phone number and additional information.";
    options.cardTitle = "American River Resort";
    options.cardContent = "http://www.americanriverresort.com/\n6019 New River Road\nColoma, CA 95613\n(530) 622-6700";
  }
  options.endSession = false;
  context.succeed(buildResponse(options));
}

function handleStartOverIntent(request,context,session) {
  let options = {};
  options.speechText =  "Let’s get you started on your next adventure. First let’s pick a state. Would you rather explore New Hampshire or California?";
  options.repromptText = "Would you rather explore New Hampshire or California?";
  options.endSession = false;
  context.succeed(buildResponse(options));
}









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
      } else if (request.intent.name === "NextNhPlaceIntent") {
        handleNextNhPlaceIntent(request,context,session);
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

function getQuote(callback) {
  var url = "http://api.forismatic.com/api/1.0/json?method=getQuote&lang=en&format=json";
  var req = http.get(url, function(res) {
    var body = "";
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      body = body.replace(/\\/g,'');
      var quote = JSON.parse(body);
      callback(quote.quoteText);
    });
  });
  req.on('error', function(err) {
    callback('',err);
  });
}

function getWish() {
  var myDate = new Date();
  var hours = myDate.getUTCHours() - 8;
  if (hours < 0) {
    hours = hours + 24;
  }
  if (hours < 12) {
    return "Good Morning. ";
  } else if (hours < 18) {
    return "Good afternoon. ";
  } else {
    return "Good evening. ";
  }
}

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
  options.speechText =  "Hello, welcome to Where-to Winnebago! Let’s get you started on your next adventure. You can respond “Back” at any time to go back to the previous question. First let’s pick a state. Would you rather explore New Hampshire or California?";
  options.repromptText = "Would you rather explore New Hampshire or California?";
  options.endSession = false;
  context.succeed(buildResponse(options));
}

function handlePickStateIntent(request,context) {
  let options = {};
  let state = request.intent.slots.State.value;
  lc_State = state.toLowerCase();
  if (lc_State == 'new hampshire' || state == 'california'){
    // options.speechText = `Let's go to ${state}`;
  }
  switch(lc_State){
    case 'new hampshire':
      options.speechText = "Great, we think the granite state is pretty cool too. Would you like to hike a mountain or visit the seacoast?";
      options.imageUrl = "http://www.rocketbanner.com/images/states/new-hampshire/new-hampshire-vinyl-banners.jpg";
      break;
    case 'california':
      options.speechText = "Okay, are you interested in family friendly activities or adults only?";
      options.imageUrl = "http://cdn.history.com/sites/2/2015/09/GettyImages-501880463.jpg";
      break;
    default:
      options.speechText = "Please choose from either California or New Hampshire for this prototype.";
      options.imageUrl = "";
  }
  options.cardTitle = "Adventure Time!"
  options.cardContent = `Let's go to ${state}!`;
  options.endSession = true;
  context.succeed(buildResponse(options));
}

function handleNhPlaceIntent(request,context,session) {
  let options = {};
  options.session = session;
  getQuote(function(quote,err) {
    if(err) {
      context.fail(err);
    } else {
      options.speechText = quote;
      options.speechText += " Do you want to listen to one more quote? ";
      options.repromptText = "You can say yes or one more. ";
      options.session.attributes.NhPlaceIntent = true;
      options.endSession = false;
      context.succeed(buildResponse(options));
    }
  });
}

function handleNextNhPlaceIntent(request,context,session) {
  let options = {};
  options.session = session;
  if(session.attributes.NhPlaceIntent) {
    getQuote(function(quote,err) {
      if(err) {
        context.fail(err);
      } else {
        options.speechText = quote;
        options.speechText += " Do you want to listen to one more quote? ";
        options.repromptText = "You can say yes or one more. ";
        //options.session.attributes.NhPlaceIntent = true;
        options.endSession = false;
        context.succeed(buildResponse(options));
      }
    });
  } else {
    options.speechText = " Wrong invocation of this intent. ";
    options.endSession = true;
    context.succeed(buildResponse(options));
  }
}

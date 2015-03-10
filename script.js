$(document).ready(function(){
//My Emails each have "sender", "subject", "message" and an archive function
var Email = Backbone.Model.extend({
  defaults : {
    sender : "anon@ymo.us",
    subject : "Email Title",
    message : "Message body here."
  },
  archive : function(){
    var email = this;
//I will trigger an event and anyone listening can do something with it
    this.trigger("archive_email", {email: email});
  },
  finalize : function(){
    var email = this;
//I will trigger an event and anyone listening can do something with it.
//It will bubble up as a gift of BackboneJS
    this.trigger("finalize", {email: email});
  }
});

//Not a very sophisticated collection
var Folder = Backbone.Collection.extend({
  model : Email
});


//This is the real "model" of the app, nothing that happens here knows how it 
//will be rendered.  This brain would work the same in a command line app,
//on a server, or in this app.  Data only.

var EmailBrain = Backbone.Model.extend({
  initialize : function(){
    var app = this;
    app.archive = new Folder();
    app.inbox = new Folder();

//This is a custom event I made at the email level.  It bubbles up into 
//the email's collection
    app.listenTo(app.inbox, "archive_email", function(data){
      //removed and added
      app.inbox.remove(data.email);
      app.archive.add(data.email);
    });
  },
  //Creating a new email model and tacking it into the inbox, 
  //it is returned for handling
  create_email : function(data){
    var email = new Email(data);
    this.inbox.add(email);
    return email;
  }
});

//This is a "VIEW" which is the go-between for a model and the UI
//Like with most Backbone Classes I extend the default Class using a JSON 
//object full of parameters.  Some might be from the Backbone API some might just be
//methods and attributes I want.
var EmailView = Backbone.View.extend({
  //Views will populate an HTML tag, called "el".  tagName will make the
  //el into an "li" tag in this case (the default is a "div")
  tagName : "li",
  //this binds functions of this class to UI event listeners.
  events : {
    "click .subject" : "message",
    "click .archive" : "archive"
  },
  //I made this to have a way to see the email body
  message : function(){
  //in Backbone Views, either "this.model" or "this.collection" will be the view's
  //wrapped-up data object.  Backbone models use .get and .set
    alert(this.model.get("message"));
  },
  
  //this just calls the model's "archive" method that you can see above.
  archive : function(){
    this.model.archive();
  },
  
  //render is where a view should draw the data-object in HTML.
  render : function(){
    var view = this;
    //I grab out a line-item template from index.html, and use underscore
    //to populate it.
    var email_template = _.template($("#line-item").html());
    this.$el.html(email_template(this.model.toJSON()));
    //this is an advanced trick, which allows the "el" to be populated off screen
    return this;
  }
  
});

//I'll use the same FolderView for both inbox and archive.
var FolderView = Backbone.View.extend({
  //initialize is a function that gets run at instantiation
  initialize : function(opts){
    //when an item is added to a messageFolder we wil render it
    this.listenTo(this.collection, "add", this.renderOne, this);
    //when any event is triggered we'll update the total number of messages
    this.listenTo(this.collection, "all", this.updateTotal, this);
  },
  
  updateTotal : function(){
    //I had a "total" class in both places,
    //this is a simple way in which we've decoupled two things.
    //really using MVC here, model updates and so on passively get "re-rendered" here, as a total.
    this.$(".total").html(this.collection.length);
  },
  
  //The following three functions are a little pattern I like for collection views
  //I might call it advanced, but collection views are interesting and subtle.  
  // I'm lending my experience here, try it in your own way as an exercise to see the benefits.
  render : function(){
    this.renderAll();
  },
  renderAll : function(){
    this.collection.each(this.renderOne, this);
  },
  renderOne : function(model){
    //This recipe lets me render each new item as a one off itemView
    //then if the model is removed or destroyed the view will remove itself from 
    //screen and stop listening to anything.
    var view = new EmailView({model: model});
    
    //notice that I lean on my render functions returning this and using this.el
    this.$(".messages").append(view.render().el);
    
    view.listenTo(model, 'remove destroy', function(){
      this.remove();
      this.stopListening();
    }, view);
  }
});

//OK this is a quickie wiring.
//I fire up an EmailBrain, InboxView, ArchiveView and wire one function to create an email.
//In a larger APP I would have an edit email screen and maybe an app brain function that does this work and gathers templates.
var session = new EmailBrain();
var inboxView = new FolderView({el: "#inbox",  collection: session.inbox});
var archiveView = new FolderView({el: "#archive",  collection: session.archive});
$("#create_mail").click(function(){
    var now = new Date();
    session.create_email({
      sender: "Andy Novocin",
      subject: "This time is " + now,
      message : "some email"
    });
});

});//end document ready callback
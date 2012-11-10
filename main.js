// MATH:dist | Calculates the hypotenuse of a triangle
Math.dist=function(dx,dy) {
	return Math.sqrt(dx*dx+dy*dy);
}

// HSL | color generator
function HSL(h,s,l) {
	this.h=h;
	this.s=s;
	this.l=l;
	this.v="hsl("+Math.round(h)+","+Math.round(s*100)+"%,"+Math.round(l*100)+"%)";
}

// SURFACE | Handles the canvas and stuff
function Surface() {
	// Grabs the canvas element and the text fields
	this.canvas=document.getElementById("surface");
	this.score=0;
	this.score_txt = document.getElementById("score");

	// If the browser supports it, let's hit that up!
	if(this.canvas.getContext) {
		// Grab the 2D context and scale the canvas to the full browser size
		this.context=this.canvas.getContext("2d");
		this.canvas.width=window.innerWidth;
		this.canvas.height=window.innerHeight;
		this.width=parseInt(this.canvas.width);
		this.height=parseInt(this.canvas.height);

		// Mouse position
		this.mx=0;
		this.my=0;

		// Number of particles and the base array of elements
		this.elements=[];
		
		// Fly through color wheel!
		var hues=10;
		var huesLeft=[];
		this.huesSorted=[];
		for(var a=0;a<hues;a++)
			huesLeft[a]=Math.round(a/hues*360);

		for(var a=0;a<hues;a++) {
			// Make a new random color along the color wheel
			var hue=huesLeft.splice(Math.floor(Math.random()*huesLeft.length),1)[0];
			var color=new HSL(hue,1,0.5);
			this.huesSorted.push(hue);

			// Make a new particle
			var e=new Bar(this,color,this.canvas.width/hues);

			// Set its initial position to the cursor and start dragging immediately
			e.setPos(this.canvas.width*a/hues,0);

			// Set its identity!
			e.setID(a);

			// Push it into the elements array
			this.elements.push(e);
		}

		this.minScore=quicksort(this.huesSorted);

		// Start the engine
		this.step();
	} else {
		// BUMMER
		alert("No <canvas> support.");
	}
}

// SURFACE:step | Primary frame handler
Surface.prototype.step=function() {
	// Clear the whole drawing rectangle
	this.context.clearRect(0,0,this.width,this.height);

	// Loop through the elements
	for(var i=0;i<this.elements.length;i++) {
		var o=this.elements[i];

		// If it's a thing, has a step(), and has a draw()...
		if(o && o.step && o.draw) {
			// Step and draw it
			o.step();
			o.draw();
		}
	}

	// Draw the dragged element if it exists; this is for depth reasons
	if(this.mouseDraw && this.mouseDraw.draw) this.mouseDraw.draw();

	//this.score_txt.innerHTML=this.score+" / "+this.minScore;
	this.score_txt.innerHTML=this.score;

	if(this.winner) {
		alert("You win!");
		return;
	}
	// Set a timeout to call this again in 10ms (pretty much whatever the fastest available interval is)
	setTimeout("surface.step()",10);
}

// SURFACE:moused | Called when the a mouse button is pressed
Surface.prototype.moused=function(e) {
	// Loop through the elements
	for(var i=0;i<this.elements.length;i++) {
		var o=this.elements[i];

		// If it's a thing, has a hitTest(), has a mousePress, and is actually hitTesting...
		if(o && o.hitTest && o.mousePress && o.hitTest(this.mx,this.my)) {
			// Press the cursor on it
			o.mousePress();
			// and don't look for a new ball, either
			break;
		}
	}
}

// SURFACE:mouseu | Called when the a mouse button is released
Surface.prototype.mouseu=function(e) {
	// Loop through the elements
	for(var i=0;i<this.elements.length;i++) {
		var o=this.elements[i];

		// If it's a thing, is being dragged, and has a mouseRelease...
		if(o && o.dragging && o.mouseRelease) {
			// Release the cursor on it
			o.mouseRelease();
		}
	}
}

// SURFACE:mousem | Called when the mouse moves on the page
//				  | Stores the mouses position to allow particle warping later
Surface.prototype.mousem=function(e) {
	this.mx=e.pageX;
	this.my=e.pageY;
}

// ELEMENT | Basic element to be drawn on the canvas
function Element(surface) {}
Element.prototype.draw=function() {} // Draws the element
Element.prototype.step=function() {} // Called every frame before drawing

// ELEMENT:setPos | Sets the x and y positions of this element
Element.prototype.setPos=function(x,y) {
	this.x=x;
	this.y=y;
}

// ELEMENT:setID | Sets the unique ID of this element
Element.prototype.setID=function(_id) {
	this.id=_id;
}

// PARTICLE | More detailed element with actual functionality
function Bar(_surface,_color,_width) {
	this.surface=_surface;
	this.color=_color;
	this.width=_width;
	this.dragging=false;
}
Bar.prototype=new Element(); // inherit from Element

// PARTICLE:hitTest | Check if a point is in contact with the object
Bar.prototype.hitTest=function(_x,_y) {
	return (_x>this.x && _x<this.x+this.width && _y>this.y && _y<this.y+this.surface.height);
}

// PARTICLE:mousePress | Called when the mouse presses the object
Bar.prototype.mousePress=function() {
	this.surface.mouseDraw=this;
	this.dragging=true;
	this.dragX=this.surface.mx-this.x;
	this.ix=this.x;
}

// PARTICLE:mouseRelease | Called when the mouse releases the object
Bar.prototype.mouseRelease=function() {
	this.surface.mouseDraw=null;
	this.dragging=false;

	var swapped=false;

	// Loop through the elements
	for(var i=0;i<this.surface.elements.length;i++) {
		var o=this.surface.elements[i];

		// If it's this object, continue!
		if(o.id==this.id) continue;

		// If it's a thing, has a hitTest, and is hitTesting...
		if(o && o.hitTest && o.hitTest(this.surface.mx,this.surface.my)) {
			var tmp=this.color;
			this.color=o.color;
			o.color=tmp;
			swapped=true;
			break;
		}
	}
	
	this.x=this.ix;
	if(swapped) {
		this.surface.score++;
		var correct=true;
		for(var a=0;a<this.surface.elements.length;a++) {
			if(this.surface.elements[a].color.h!=this.surface.huesSorted[a]) {
				correct=false;
			}
		}
		if(correct) this.surface.winner=true;
	}
}

// PARTICLE:ELEMENT:step | Updates the position and acceleration every frame
Bar.prototype.step=function() {
	// If it's being dragged by the cursor...
	if(this.dragging) {
		this.x=this.surface.mx-this.dragX;
	}
	
	// Boundary checks
	if(this.x<0) this.x=0;
	if(this.x>this.surface.width-this.width) this.x=this.surface.width-this.width;
}

// PARTICLE:ELEMENT:draw | Draws the particle
Bar.prototype.draw=function() {
	this.surface.context.beginPath();
	this.surface.context.fillStyle=this.color.v;
	this.surface.context.fillRect(this.x,this.y,this.width,this.surface.height);
}

// jQuery to set everything up on page load
var surface;
$(function() {
	// Make a new Surface
	surface=new Surface();

	// Bind events
	surface.canvas.addEventListener("mousedown",function(e) {surface.moused(e)},true);
	surface.canvas.addEventListener("mousemove",function(e) {surface.mousem(e)},true);
	surface.canvas.addEventListener("mouseup",function(e) {surface.mouseu(e)},true);

	// Disable right clicks
	window.addEventListener("selectstart",function(e) {e.preventDefault()},true);
	window.addEventListener("contextmenu",function(e) {e.preventDefault()},true);
});

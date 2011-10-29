 $(document).ready(function() {
            var id = Math.random();
        
            var socket = io.connect(document.domain, { port: feelpad.port });
            
            socket.on('connect', function () {
                socket.send('hi send');
                console.log('connect'); 
                
                startApp(socket);
            });
            
    
            console.log('yelp');
        });



function startApp(socket) {
    
    var hasTouch     = 'ontouchstart' in document.documentElement,
        result       = $('#result'),
        feelpad      = $('#feelpad'),
        maxHeight    = $(window).height(),
        date         = new Date(),
        startingTime = date.getTime(),
        assetRoot    = "http://cdn.deepcobalt.com/fanyrd",
        blockSending = false,
        happiness    = 0,
        mouseDown    = false;
             
    if (hasTouch) { $('body').addClass('touch'); }
    
    //Preload Images
    var preloadImg = new Image();
    for (var imageNum=0; imageNum<=24; imageNum++) {
        var imageNum  = (imageNum < 10) ? '0' + imageNum : imageNum,
            imageName = assetRoot+"/images/hand_seq_small/png_seq_small_000"+imageNum+".png";           
        preloadImg.src = imageName; 
    }
    

    sendHappiness = _.throttle(function(happiness) {
        var nowDate   = new Date(),
            nowTime   = nowDate.getTime() - startingTime;
         
        happiness = happiness.toFixed(2); // Round to 2 decimal places
        //result.html(imageName+": "+nowTime+': '+happiness);
        
        console.log('sending '+happiness);
        socket.emit('rate', { t: nowDate, r: happiness, id:'comps' });
     }, 500);                
    
    
    function updateFeelPad(percentage) {
         var imageNum  = Math.round((percentage/100*24)),
             imageNum  = (imageNum < 10) ? '0' + imageNum : imageNum,
             imageName = assetRoot+"/images/hand_seq_small/png_seq_small_000"+imageNum+".png";            
         feelpad.css('background-image', 'url('+imageName+')');    
         $('#result').html(imageName);         
    }
    
    
    feelpad.bind("mousedown", function(e) {
        feelpad.addClass('active');
        mouseDown = true;
    });

    feelpad.bind("mouseup", function(e) {
        feelpad.removeClass('active');
        mouseDown = false;
    });
    
    
    feelpad.bind("mousemove", function(e) {    
         //console.log(e, e.originalEvent.pageY);
         var y = e.originalEvent.pageY;

         // Cap at limits
         if (y<0) y=0;
         if (y>maxHeight) y=maxHeight;
        
         var percentage = (y/maxHeight)*100;         
         happiness  = (((y/maxHeight)*2)-1)*-1;

         updateFeelPad(percentage);
         if (mouseDown) { sendHappiness(happiness); }
    });
    
    feelpad.bind("touchmove", function(e) {  
         e.preventDefault();  
         var y = e.originalEvent.changedTouches[0].pageY;           
         
         // Cap at limits
         if (y<0) y=0;
         if (y>maxHeight) y=maxHeight;
         
         var percentage = (y/maxHeight)*100;        
         happiness  = (((y/maxHeight)*2)-1)*-1;
                  
         updateFeelPad(percentage);
         
         sendHappiness(happiness);                     
    });  
    
    
};
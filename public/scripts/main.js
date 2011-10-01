 $(document).ready(function() {
            var id = Math.random();
        
            var socket = io.connect();
            socket.on('connect', function () {
                socket.send('hi send');
                console.log('connect'); 
                
                startApp(socket);
            });
            
    
            console.log('yelp');
        });

function startApp(socket) {
    
    var result       = $('#result'),
        feelpad      = $('#feelpad'),
        maxHeight    = $(window).height(),
        date         = new Date(),
        startingTime = date.getTime(),
        assetRoot    = "http://cdn.deepcobalt.com/fanyrd";
    
    
    // Prevent page from scrolling
    /*
    document.addEventListener('touchmove', function(e){
        e.preventDefault();
    });
    */
     
    
    //Preload Images
    var preloadImg = new Image();
    for (var imageNum=0; imageNum<=24; imageNum++) {
        var imageNum  = (imageNum < 10) ? '0' + imageNum : imageNum,
            imageName = assetRoot+"/images/hand_seq_small/png_seq_small_000"+imageNum+".png";           
        preloadImg.src = imageName; 
    }
    

    sendHappiness = _.throttle(function(happiness, percentage) {
        var nowDate   = new Date(),
            nowTime   = nowDate.getTime() - startingTime;
         
        happiness = happiness.toFixed(2); // Round to 2 decimal places
        //result.html(imageName+": "+nowTime+': '+happiness);
        socket.emit('rate', { t: nowDate, r: happiness, id:'dv1' });
     }, 500);                
    
    $('#feelpad').bind("touchmove", function(e) {  
    //$('#feelpad')[0].addEventListener("touchmove", function(e) {  
         //Disable scrolling by preventing default touch behaviour  

         e.preventDefault();  
         var orig = e.originalEvent;  
         var x = orig.changedTouches[0].pageX;  
         var y = orig.changedTouches[0].pageY;  
         if (y<0) y=0;
         if (y>maxHeight) y=maxHeight;
         
         var percentage = (y/maxHeight)*100,
             happiness  = (((y/maxHeight)*2)-1)*-1;
         
         //var hue = happiness*100;
         //feelpad.css('background-color', 'hsl('+hue+', 100%, 50%)');
         //feelpad.css('background-color', 'hsl(350, '+(100-percentage)+'%, 50%)');
         
         var imageNum  = Math.round((percentage/100*24)),
             imageNum  = (imageNum < 10) ? '0' + imageNum : imageNum,
             imageName = assetRoot+"/images/hand_seq_small/png_seq_small_000"+imageNum+".png";            
         feelpad.css('background-image', 'url('+imageName+')');         
         
         $('#result').html(imageName);
         sendHappiness(happiness, percentage);                     
    });  
    
    
};
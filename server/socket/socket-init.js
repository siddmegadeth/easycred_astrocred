(function() {
    io.on('connection', function(socket) {
        log('--------------------------------------------------------------:')
        log('Socket IO :');
        log('--------------------------------------------------------------:')
       
        console.log('Socket.IO Connection Is Made :');
        console.log('Client connected');
        socket.on("hello new client", function() {
            log("you are now connected");
        });
        socket.emit("check", "you are now connected");
        socket.on('disconnect', function() {

            log('Disconnected And Cleared Interval');
        });


       
    });

})()
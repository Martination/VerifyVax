const QrScanner = function (vidId) {

    const video = document.getElementById(vidId);
    const canvasElement = document.createElement("canvas");
    const canvas = canvasElement.getContext("2d");
    const promise = {};
    let vidStream;

    const overlay = document.createElement('DIV');
    overlay.id = "overlay";
    overlay.hidden = true;
    video.parentElement.appendChild(overlay);

    function stop() {
        // the scanner may not have started yet
        if (!vidStream) return false;

        vidStream.getTracks().forEach(function (track) {
            if (track.readyState == 'live' && track.kind === 'video') {
                track.stop();
            }
        });
        vidStream = undefined;
        promise.resolve({ data: undefined, version: undefined, state: "stopped" });
        promise.resolve = promise.reject = undefined;

        return true;
    }

    function scan() {

        return new Promise((resolve, reject) => {
            promise.resolve = resolve;
            promise.reject = reject;
            // Use facingMode: environment to attempt to get the front camera on phones
            navigator.mediaDevices.getUserMedia({ video: { width: 600, facingMode: "environment" } })
                .then(function (stream) {
                    video.srcObject = stream;
                    video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
                    video.play();
                    vidStream = stream;

                    requestAnimationFrame(tick);
                });
        });
    }

    function tick() {

        if (video.readyState === video.HAVE_ENOUGH_DATA) {

            canvasElement.height = video.videoHeight;
            canvasElement.width = video.videoWidth;
            canvas.drawImage(video, 0, 0, video.videoHeight, video.videoHeight);

            const vidContainer = video.parentElement;
            overlay.style.top = Math.max(((vidContainer.clientHeight - overlay.offsetHeight) / 2), 50) + "px";
            overlay.style.left = Math.max(((vidContainer.clientWidth - overlay.offsetWidth) / 2), 50) + "px";
            overlay.hidden = false;

            const imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code) {
                try {
                    promise.resolve({ data: code.data, version: code.version, state: "complete" });
                } catch (error) { }
                stop();
                return;
            }
        }

        try {
            requestAnimationFrame(tick);
        } catch (error) { }
    }

    return {
        scan: scan,
        stop: stop
    };

}

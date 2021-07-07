const secExtractPublicKey = (() => {

    console.log("Starting extract keys")

    const sec = new Section('extractPublicKey', "Extract Public Key URL");
    sec.setDocs(verifierDocs.extractPublicKey.l, verifierDocs.extractPublicKey.r);
    sec.addTextField("Issuer Key URL");

    sec.process = async () => {
        console.log("Starting async extract keys")

        const jwsPayloadText = secDecodeJWS.getValue(1 /*jws-payload*/);;
        const jwsPayload = tryParse(jwsPayloadText);

        if (jwsPayload === undefined) {
            return;
        }

        if (jwsPayload.iss === undefined) {
            sec.setErrors([secError("Cannot find .iss property")]);;
            return;
        }

        // document.getElementById('keyDataExtract').innerHTML = (jwsPayload.iss + '/.well-known/jwks.json');
        document.getElementById('keyDataExtract').value = (jwsPayload.iss);
        window.validateCode('keyDataExtract');

        console.log("Setting value of sec extract keys")

        await sec.setValue(jwsPayload.iss + '/.well-known/jwks.json');
        console.log("Done setting value of sec extract keys")


    };

    sec.validate = async function (field) {
        console.log("Validating extract keys")
        this.setErrors(/^https:\/\//.test(field.value) ? [] : [`Issuer shall use https://`]);
        sec.valid() ? sec.goNext() : sec.next?.clear();
    }

    console.log("Finishing extract keys")

    return sec;

})();

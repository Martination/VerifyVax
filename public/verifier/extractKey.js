const secExtractPublicKey = (() => {

    const sec = new Section('extractPublicKey', "Extract Public Key URL");
    sec.setDocs(verifierDocs.extractPublicKey.l, verifierDocs.extractPublicKey.r);
    sec.addTextField("Issuer Key URL");

    sec.process = async () => {

        const jwsPayloadText = secDecodeJWS.getValue(1 /*jws-payload*/);;
        const jwsPayload = tryParse(jwsPayloadText);

        if (jwsPayload === undefined) {
            return;
        }

        if (jwsPayload.iss === undefined) {
            sec.setErrors([secError("Cannot find .iss property")]);;
            return;
        }

        const issuer = jwsPayload.iss;
        //  URL for the VCI issuers list from https://github.com/the-commons-project/vci-directory
        const publicIssuers = 'https://raw.githubusercontent.com/the-commons-project/vci-directory/main/vci-issuers.json'
        const downloadUrl = 'download-public-key';
        let result = await restCall(downloadUrl, { keyUrl: publicIssuers }, 'POST');
        let issuersList = result.keySet.participating_issuers;
        let issuerObject = issuersList.find(ele => ele.iss === issuer);

        if (!issuerObject) issuerObject = { name: "UNVERIFIED" };
        document.getElementById('summaryIss').value = `<b>${issuerObject.name}</b>, <a href="${issuer + '/.well-known/jwks.json'}">${issuer}</a>`;
        window.validateCode('summaryIss');

        await sec.setValue(issuer + '/.well-known/jwks.json');
    };

    sec.validate = async function (field) {
        this.setErrors(/^https:\/\//.test(field.value) ? [] : [`Issuer shall use https://`]);
        sec.valid() ? sec.goNext() : sec.next?.clear();
    }

    return sec;

})();

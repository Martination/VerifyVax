// let CAcovidKey;
// fetch('./CACovidKey.json')
//     .then(res => { return res.json(); })
//     .then(data => CAcovidKey = JSON.stringify(data, null, 2));

const secDownloadKey = (() => {

    const sec = new Section('downloadKey', "Download Issuer Public Key");
    sec.setDocs(verifierDocs.downloadKey.l, verifierDocs.downloadKey.r);
    sec.addTextField("Issuer Public KeySet");

    sec.process = async () => {

        const previousControl = secExtractPublicKey;
        const publicKeyUrl = previousControl.getValue();

        if (!publicKeyUrl) return;

        const CAcovidKeyUrl = 'https://myvaccinerecord.cdph.ca.gov/creds/.well-known/jwks.json';

        if (publicKeyUrl === CAcovidKeyUrl) {
            fetch('./CACovidKey.json')
                .then(res => { return res.json(); })
                .then(data => sec.setValue(JSON.stringify(data, null, 2)));
        } else {
            const url = 'download-public-key';
            let result = await restCall(url, { keyUrl: publicKeyUrl }, 'POST');

            sec.setErrors(result.error);
            await sec.setValue(JSON.stringify(result.keySet, null, 2));
        }

    };

    sec.validate = async function (field) {
        const keySet = field.value;
        sec.setErrors((await restCall('/validate-key-set', { data: keySet }, 'POST')).errors);
        sec.valid() ? sec.goNext() : sec.next?.clear();
    }

    return sec;

})();

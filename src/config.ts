export const Config = {

    // REST API endpoints
    VALIDATE_FHIR_BUNDLE:                   '/validate-fhir-bundle',
    VALIDATE_QR_NUMERIC:                    '/validate-qr-numeric',
    VALIDATE_PAYLOAD:                       '/validate-jws-payload',
    VALIDATE_KEYSET:                        '/validate-key-set',
    INFLATE_PAYLOAD:                        '/inflate-payload',
    DOWNLOAD_PUBLIC_KEY:                    '/download-public-key',

    SERVER_BASE: process.env.SERVER_BASE || 'http://localhost:' + (process.env.PORT || 8080) + '/',
    SERVICE_PORT: process.env.PORT || 8080
}

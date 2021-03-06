const getAPIGateway = () => {
    const domain = window.location.hostname;
    if (domain === "localhost" || domain === "127.0.0.1") {
        return "http://localhost:3000/api/v1";
    }
    return "https://diaocbaoloc.com.vn/api/v1";
};

module.exports = {
    API_GATEWAY: getAPIGateway(),
    GHN_TOKEN: "6083ac66-4df1-11ec-bde8-6690e1946f41",
};

export const PACKAGE_JSON_TEMPLATE = `
{
    "dependencies": {
        "react": "^18.0.0",
        "react-dom": "^18.0.0",
        "react-scripts": "^5.0.1"
},
"scripts": {
    "start": "BROWSER=none react-scripts --openssl-legacy-provider start"
},
"main": "./src/index.js",
    "browserslist": {
    "production": [
        ">0.2%",
        "not dead",
        "not op_mini all"
    ],
        "development": [
            "last 1 chrome version",
            "last 1 firefox version",
            "last 1 safari version"
        ]
}
}`;
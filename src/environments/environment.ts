// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.


//Local
export const environment = {
 production: false,
  apiUrl: 'https://localhost:7188/api',
  firebaseConfig: {
   apiKey: "AIzaSyBxm2YZhRXkQNU9kpK33SFYIrmW-rqTTcI",
   authDomain: "portal-1d075.firebaseapp.com",
   projectId: "portal-1d075",
   storageBucket: "portal-1d075.firebasestorage.app",
   messagingSenderId: "552612021319",
   appId: "1:552612021319:web:8aecc40c6bb250f342dd62",
   measurementId: "G-RP9QMZ2758"
  }
};


//UAT
// export const environment = {
//  production: false,
//   apiUrl: 'http://192.168.7.201:98/api',
//   firebaseConfig: {
//    apiKey: "AIzaSyBxm2YZhRXkQNU9kpK33SFYIrmW-rqTTcI",
//    authDomain: "portal-1d075.firebaseapp.com",
//    projectId: "portal-1d075",
//    storageBucket: "portal-1d075.firebasestorage.app",
//    messagingSenderId: "552612021319",
//    appId: "1:552612021319:web:8aecc40c6bb250f342dd62",
//    measurementId: "G-RP9QMZ2758"
//   }
 
// };

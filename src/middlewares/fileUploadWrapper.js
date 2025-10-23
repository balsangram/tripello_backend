// import fileUpload from "express-fileupload";

// const fileUploadWrapper = (methods) => {
//   return (req, res, next) => {
//     if (methods.includes(req.method)) {
//       fileUpload({
//         useTempFiles: false,
//         limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB file size limit
//         debug: true,
//       })(req, res, next);
//     } else {
//       next(); // Skip fileUpload middleware for other methods
//     }
//   };
// };

// export default fileUploadWrapper;


import fileUpload from "express-fileupload";

const fileUploadWrapper = (methods = ["POST", "PUT"]) => {
  return (req, res, next) => {
    if (methods.includes(req.method)) {
      console.log(`📂 File Upload Middleware Activated for ${req.method} Request`);

      // ✅ Apply file upload middleware properly
      fileUpload({
        useTempFiles: true, // Store files temporarily to prevent memory overload
        tempFileDir: "/tmp/", // Temporary directory for file uploads
        limits: { fileSize: 50 * 1024 * 1024 }, // Limit to 50MB per file
        abortOnLimit: true, // Abort if file size exceeds limit
        debug: true, // Enable debugging (remove in production)
      })(req, res, next);
    } else {
      next(); // Skip file upload middleware for other methods
    }
  };
};

export default fileUploadWrapper;


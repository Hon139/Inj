import React, { Component } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import './App.css';

import UploadPdf from "./components/upload-files.component";

function App() {
  return(
    <div>
      <UploadPdf/>
    </div>
  );
}

export default App;
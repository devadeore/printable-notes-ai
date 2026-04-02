import * as pdfjsLib from "pdfjs-dist";
import { useState } from "react";

// FIX WORKER
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function App() {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // LOAD PDF FUNCTION
  const loadPDF = async () => {
    if (!files.length) return;

    setLoading(true);
    setProgress(0);

    let totalPages = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const arrayBuffer = await file.arrayBuffer();

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      totalPages += pdf.numPages;

      // update progress
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    console.log("Total Pages:", totalPages);

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 text-white p-6">

      {/* Navbar */}
      <div className="flex justify-between mb-6">
        <h1 className="text-xl font-bold">StudyAI</h1>
        <div>
          <button className="mr-3">Login</button>
          <button className="bg-blue-500 px-4 py-1 rounded">Signup</button>
        </div>
      </div>

      {/* Steps */}
      <div className="flex justify-center gap-3 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`w-8 h-8 flex items-center justify-center rounded-full ${
              step === s ? "bg-blue-400" : "bg-gray-600"
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="bg-white/10 p-6 rounded-xl text-center space-y-4 max-w-xl mx-auto">

          <h2 className="text-xl font-semibold">📄 Upload PDFs</h2>

          <input
            type="file"
            multiple
            accept="application/pdf"
            onChange={(e) => {
              if (!e.target.files) return;
              setFiles(Array.from(e.target.files));
            }}
            className="text-sm"
          />

          {/* FILE LIST */}
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex justify-between items-center bg-white/10 px-4 py-2 rounded-lg"
              >
                <span className="text-sm">{file.name}</span>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (index === 0) return;
                      const newFiles = [...files];
                      [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
                      setFiles(newFiles);
                    }}
                    className="text-xs bg-gray-600 px-2 py-1 rounded"
                  >
                    ↑
                  </button>

                  <button
                    onClick={() => {
                      if (index === files.length - 1) return;
                      const newFiles = [...files];
                      [newFiles[index + 1], newFiles[index]] = [newFiles[index], newFiles[index + 1]];
                      setFiles(newFiles);
                    }}
                    className="text-xs bg-gray-600 px-2 py-1 rounded"
                  >
                    ↓
                  </button>

                  <button
                    onClick={() => {
                      setFiles(files.filter((_, i) => i !== index));
                    }}
                    className="text-xs bg-red-500 px-2 py-1 rounded"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* LOADING UI */}
          {loading && (
            <div className="mt-4">
              <p className="text-sm">Processing PDF... {progress}%</p>
              <div className="w-full bg-gray-600 h-2 rounded mt-2">
                <div
                  className="bg-green-400 h-2 rounded"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* NEXT BUTTON */}
          <button
            disabled={loading}
            onClick={async () => {
              await loadPDF();
              setStep(2);
            }}
            className="bg-blue-500 px-6 py-2 rounded-lg"
          >
            {loading ? "Processing..." : "Next →"}
          </button>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="bg-white/10 p-6 rounded-xl text-center space-y-4 max-w-xl mx-auto">
          <h2 className="text-xl font-semibold">📑 Preview (Coming next)</h2>

          <button
            onClick={() => setStep(1)}
            className="bg-gray-600 px-4 py-2 rounded"
          >
            Back
          </button>
        </div>
      )}

    </div>
  );
}

export default App;
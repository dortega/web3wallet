import { useCallback, useState, type DragEvent } from 'react';

interface FileUploadProps {
  accept?: string;
  onFile: (buffer: ArrayBuffer, name: string) => void;
}

export function FileUpload({ accept = '.xlsx', onFile }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      const buffer = await file.arrayBuffer();
      onFile(buffer, file.name);
    },
    [onFile],
  );

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragging(false)}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        dragging
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-gray-700 hover:border-gray-600'
      }`}
    >
      <label className="cursor-pointer block">
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {fileName ? (
          <p className="text-sm text-gray-300">{fileName}</p>
        ) : (
          <p className="text-sm text-gray-500">
            Drop .xlsx file here or click to browse
          </p>
        )}
      </label>
    </div>
  );
}

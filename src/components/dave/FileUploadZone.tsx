import { useState, useCallback } from "react";
import { Upload, File, FileText, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { uploadContent } from "@/lib/api";

interface FileUploadZoneProps {
  onUploadComplete?: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  title?: string;
  tags?: string[];
  error?: string;
  uploadedId?: string;
}

export function FileUploadZone({ onUploadComplete }: FileUploadZoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ['pdf', 'txt', 'md', 'doc', 'docx'].includes(ext || '');
    });

    if (droppedFiles.length === 0) {
      toast.error("Please upload PDF, TXT, MD, DOC, or DOCX files");
      return;
    }

    const newFiles: UploadFile[] = droppedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      status: 'pending',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files).filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ['pdf', 'txt', 'md', 'doc', 'docx'].includes(ext || '');
    });

    if (selectedFiles.length === 0) {
      toast.error("Please upload PDF, TXT, MD, DOC, or DOCX files");
      return;
    }

    const newFiles: UploadFile[] = selectedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      status: 'pending',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadFile = async (uploadFile: UploadFile) => {
    setFiles(prev => prev.map(f =>
      f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 10 } : f
    ));

    try {
      // Read file as base64
      const base64Content = await readFileAsBase64(uploadFile.file);

      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id ? { ...f, progress: 30 } : f
      ));

      // Determine content type
      const ext = uploadFile.file.name.split('.').pop()?.toLowerCase();
      let contentType: "article" | "document" | "image" | "presentation" | "proposal" | "spreadsheet" | "video" = 'document';
      if (uploadFile.file.name.toLowerCase().includes('article')) {
        contentType = 'article';
      } else if (ext === 'pdf' || ext === 'doc' || ext === 'docx') {
        contentType = 'document';
      } else if (ext === 'ppt' || ext === 'pptx') {
        contentType = 'presentation';
      } else if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') {
        contentType = 'spreadsheet';
      } else if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'gif' || ext === 'webp') {
        contentType = 'image';
      } else if (ext === 'mp4' || ext === 'mov' || ext === 'avi') {
        contentType = 'video';
      }

      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id ? { ...f, status: 'processing', progress: 50 } : f
      ));

      // Upload to API
      const result = await uploadContent({
        file_content: base64Content,
        file_name: uploadFile.file.name,
        title: uploadFile.file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        content_type: contentType,
        extract_to_knowledge: true,
        tags: [],
        topic_keywords: []
      });

      if (result.success) {
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id ? {
            ...f,
            status: 'success',
            progress: 100,
            title: uploadFile.file.name,
            tags: [],
            uploadedId: result.id
          } : f
        ));

        toast.success(`Uploaded: ${uploadFile.file.name}`);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id ? {
          ...f,
          status: 'error',
          progress: 0,
          error: errorMessage
        } : f
      ));

      toast.error(`Failed to upload ${uploadFile.file.name}: ${errorMessage}`);
    }
  };

  const handleUploadAll = async () => {
    setIsProcessing(true);

    const pendingFiles = files.filter(f => f.status === 'pending');

    for (const file of pendingFiles) {
      await uploadFile(file);
    }

    setIsProcessing(false);

    const successCount = files.filter(f => f.status === 'success').length;
    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} file(s)`);
      onUploadComplete?.();
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleClearAll = () => {
    setFiles([]);
  };

  const statusIcons = {
    pending: <File className="h-4 w-4 text-muted-foreground" />,
    uploading: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
    processing: <Loader2 className="h-4 w-4 animate-spin text-amber-500" />,
    success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    error: <XCircle className="h-4 w-4 text-red-500" />
  };

  const statusText = {
    pending: 'Pending',
    uploading: 'Uploading...',
    processing: 'Processing...',
    success: 'Completed',
    error: 'Failed'
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const successCount = files.filter(f => f.status === 'success').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          File Upload
          {files.length > 0 && (
            <Badge variant="secondary">
              {files.length} file{files.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Drag & drop PDF, DOCX, TXT, or MD files to auto-extract and upload
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted hover:border-primary/50 hover:bg-accent/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            multiple
            accept=".pdf,.txt,.md,.doc,.docx"
            onChange={handleFileSelect}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              Drop files here or <span className="text-primary underline">browse</span>
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, DOCX, TXT, MD accepted • Unlimited file size
            </p>
          </label>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Badge variant="outline">
                  {successCount} completed
                </Badge>
                {errorCount > 0 && (
                  <Badge variant="destructive">
                    {errorCount} failed
                  </Badge>
                )}
                {pendingCount > 0 && (
                  <Badge>
                    {pendingCount} pending
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={isProcessing}
              >
                Clear All
              </Button>
            </div>

            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="space-y-3">
                {files.map((uploadFile) => (
                  <div
                    key={uploadFile.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {statusIcons[uploadFile.status]}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {uploadFile.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={uploadFile.status === 'error' ? 'destructive' : 'outline'} className="shrink-0">
                            {statusText[uploadFile.status]}
                          </Badge>
                          {uploadFile.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRemoveFile(uploadFile.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {(uploadFile.status === 'uploading' || uploadFile.status === 'processing') && (
                        <Progress value={uploadFile.progress} className="h-1" />
                      )}

                      {uploadFile.status === 'success' && uploadFile.tags && uploadFile.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {uploadFile.tags.map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {uploadFile.status === 'error' && uploadFile.error && (
                        <div className="flex items-start gap-1.5 text-xs text-destructive">
                          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{uploadFile.error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Button
                onClick={handleUploadAll}
                disabled={isProcessing || pendingCount === 0}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing {pendingCount} file{pendingCount !== 1 ? 's' : ''}...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {pendingCount} file{pendingCount !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

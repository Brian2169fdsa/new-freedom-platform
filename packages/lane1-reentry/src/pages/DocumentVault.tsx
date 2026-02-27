import { useState, useMemo } from 'react';
import {
  PageContainer,
  Card,
  CardContent,
  Button,
  Badge,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  Input,
  useAuth,
  useCollection,
} from '@reprieve/shared';
import type { UserDocument, DocumentCategory } from '@reprieve/shared';
import { uploadFile } from '@reprieve/shared/services/firebase/storage';
import {
  addDocument,
  deleteDocument,
  updateDocument,
} from '@reprieve/shared/services/firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { where } from 'firebase/firestore';
import {
  Upload,
  FileText,
  FolderOpen,
  Trash2,
  Download,
  Eye,
  Plus,
  ArrowLeft,
  CreditCard,
  Baby,
  Shield,
  Scale,
  GraduationCap,
  Award,
  Heart,
  AlertTriangle,
  Share2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

/** Safely convert Timestamp-like objects, Dates, or strings to a native Date. */
function toNativeDate(ts: unknown): Date {
  if (ts instanceof Date) return ts;
  if (typeof ts === 'string') return new Date(ts);
  if (ts && typeof (ts as any).toDate === 'function')
    return (ts as any).toDate();
  return new Date(ts as number);
}

const CATEGORIES: { value: DocumentCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'id', label: 'IDs' },
  { value: 'court_papers', label: 'Court Papers' },
  { value: 'certification', label: 'Certificates' },
  { value: 'medical', label: 'Medical' },
  { value: 'other', label: 'Other' },
];

const UPLOAD_CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: 'id', label: 'ID / Drivers License' },
  { value: 'birth_certificate', label: 'Birth Certificate' },
  { value: 'social_security', label: 'Social Security Card' },
  { value: 'court_papers', label: 'Court Papers' },
  { value: 'diploma', label: 'Diploma / GED' },
  { value: 'certification', label: 'Certification' },
  { value: 'medical', label: 'Medical Records' },
  { value: 'other', label: 'Other' },
];

const categoryIcons: Record<DocumentCategory, React.ElementType> = {
  id: CreditCard,
  birth_certificate: Baby,
  social_security: Shield,
  court_papers: Scale,
  diploma: GraduationCap,
  certification: Award,
  medical: Heart,
  other: FileText,
};

const categoryColors: Record<DocumentCategory, string> = {
  id: 'bg-blue-100 text-blue-700',
  birth_certificate: 'bg-pink-100 text-pink-700',
  social_security: 'bg-blue-100 text-blue-700',
  court_papers: 'bg-purple-100 text-purple-700',
  diploma: 'bg-green-100 text-green-700',
  certification: 'bg-teal-100 text-teal-700',
  medical: 'bg-red-100 text-red-700',
  other: 'bg-slate-100 text-slate-700',
};

function isExpiringSoon(expirationDate?: unknown): boolean {
  if (!expirationDate) return false;
  const now = new Date();
  const expDate = toNativeDate(expirationDate);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return expDate <= thirtyDaysFromNow && expDate > now;
}

function isExpired(expirationDate?: unknown): boolean {
  if (!expirationDate) return false;
  return toNativeDate(expirationDate) <= new Date();
}

function formatDate(timestamp?: unknown): string {
  if (!timestamp) return '';
  return toNativeDate(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DocumentVault() {
  const { user } = useAuth();
  const { data: documents, loading } = useCollection<UserDocument>(
    'documents',
    where('userId', '==', user?.uid ?? '')
  );

  // Document requests from case manager
  const { data: pendingRequests } = useCollection(
    'documentRequests',
    where('userId', '==', user?.uid ?? ''),
    where('status', '==', 'pending'),
  );

  const [activeTab, setActiveTab] = useState<DocumentCategory | 'all'>('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserDocument | null>(null);
  const [uploading, setUploading] = useState(false);

  // Upload form state
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('id');
  const [uploadFile_, setUploadFile] = useState<File | null>(null);
  const [uploadExpiration, setUploadExpiration] = useState('');

  const filteredDocuments = useMemo(() => {
    if (activeTab === 'all') return documents;
    return documents.filter((d) => d.category === activeTab);
  }, [documents, activeTab]);

  const handleUpload = async () => {
    if (!uploadFile_ || !user?.uid) return;

    setUploading(true);
    try {
      let fileURL = '';
      if (!DEMO_MODE) {
        const timestamp = Date.now();
        const storagePath = `documents/${user.uid}/${timestamp}_${uploadFile_.name}`;
        fileURL = await uploadFile(storagePath, uploadFile_);
      } else {
        fileURL = `demo://documents/${uploadFile_.name}`;
      }

      await addDocument('documents', {
        userId: user.uid,
        category: uploadCategory,
        fileName: uploadFile_.name,
        fileURL,
        verified: false,
        ...(uploadExpiration
          ? { expirationDate: Timestamp.fromDate(new Date(uploadExpiration)) }
          : {}),
      });

      // Reset form
      setUploadCategory('id');
      setUploadFile(null);
      setUploadExpiration('');
      setUploadOpen(false);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument('documents', deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleToggleSharing = async (docItem: UserDocument) => {
    try {
      const currentShared = (docItem as any).shared ?? false;
      await updateDocument('documents', docItem.id, {
        shared: !currentShared,
      });
    } catch (error) {
      console.error('Toggle sharing failed:', error);
    }
  };

  return (
    <PageContainer
      title="Document Vault"
      subtitle="Securely store your important documents"
      action={
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Upload
        </Button>
      }
    >
      {/* Back link */}
      <Link
        to="/tools"
        className="inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-800 -mt-2 mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Tools
      </Link>

      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveTab(cat.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === cat.value
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Document list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No documents found</p>
            <p className="text-sm text-slate-400 mt-1">
              {activeTab === 'all'
                ? 'Upload your first document to get started.'
                : `No documents in this category yet.`}
            </p>
            <Button
              size="sm"
              className="mt-4"
              onClick={() => setUploadOpen(true)}
            >
              <Upload className="h-4 w-4 mr-1" /> Upload Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDocuments.map((docItem) => {
            const Icon = categoryIcons[docItem.category] || FileText;
            const colorClass = categoryColors[docItem.category] || 'bg-slate-100 text-slate-700';
            const expired = isExpired(docItem.expirationDate);
            const expiringSoon = isExpiringSoon(docItem.expirationDate);

            return (
              <Card key={docItem.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-slate-800 truncate">
                          {docItem.fileName}
                        </h4>
                        {docItem.verified && (
                          <Badge variant="success">Verified</Badge>
                        )}
                        {expired && (
                          <Badge variant="destructive">Expired</Badge>
                        )}
                        {expiringSoon && !expired && (
                          <Badge variant="warning">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Expiring Soon
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span>Uploaded {formatDate(docItem.uploadedAt)}</span>
                        {docItem.expirationDate && (
                          <span
                            className={
                              expired
                                ? 'text-red-500'
                                : expiringSoon
                                ? 'text-orange-500'
                                : ''
                            }
                          >
                            Expires {formatDate(docItem.expirationDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <a
                        href={docItem.fileURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      <a
                        href={docItem.fileURL}
                        download
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleToggleSharing(docItem)}
                        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                          (docItem as any).shared
                            ? 'text-blue-600 bg-blue-50 hover:text-blue-700'
                            : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                        title={(docItem as any).shared ? 'Stop sharing' : 'Share with case manager'}
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(docItem)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {UPLOAD_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                File
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 file:mr-3 file:border-0 file:bg-blue-50 file:text-blue-700 file:text-sm file:font-medium file:rounded file:px-2 file:py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </div>
              {uploadFile_ && (
                <p className="text-xs text-slate-400 mt-1">
                  {uploadFile_.name} ({(uploadFile_.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Expiration Date (optional)
              </label>
              <Input
                type="date"
                value={uploadExpiration}
                onChange={(e) => setUploadExpiration(e.target.value)}
              />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setUploadOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!uploadFile_ || uploading}>
            {uploading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-1" /> Upload
              </>
            )}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Request Document Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-slate-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-blue-100 flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-blue-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-800 mb-1">
                Document Requests
              </h4>
              <p className="text-xs text-slate-500 mb-3">
                Your case manager may request specific documents. Any pending
                requests will appear here.
              </p>
              {pendingRequests.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  No pending document requests.
                </p>
              ) : (
                <div className="space-y-2">
                  {pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between rounded-lg bg-white border border-slate-200 p-2.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Upload className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span className="text-sm text-slate-700 truncate">
                          {(req as any).documentName || 'Requested Document'}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs flex-shrink-0"
                        onClick={() => setUploadOpen(true)}
                      >
                        Upload
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogHeader>
          <DialogTitle>Delete Document</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p className="text-sm text-slate-600">
            Are you sure you want to delete{' '}
            <span className="font-medium text-slate-800">
              {deleteTarget?.fileName}
            </span>
            ? This action cannot be undone.
          </p>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </DialogFooter>
      </Dialog>
    </PageContainer>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Star, Send, ArrowLeft, MessageSquare, AlertCircle, Upload, X, Image, Video } from "lucide-react";
import { Header } from "@/components/Header";
import { z } from "zod";

const supportSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    issueType: z.string().min(1, "Please select an issue type"),
    message: z.string().min(10, "Message must be at least 10 characters"),
    rating: z.number().min(1, "Please provide a rating").max(5),
});

const issueTypes = [
    { value: "fraud", label: "Fraud / Security Issue" },
    { value: "technical", label: "Technical Bug" },
    { value: "spam", label: "Spam / Abuse" },
    { value: "payment", label: "Payment Issue" },
    { value: "feature", label: "Feature Request" },
    { value: "feedback", label: "General Feedback" },
    { value: "other", label: "Other" },
];

export default function Support() {
    const { user } = useAuth();
    // const navigate = useNavigate(); // Removed as we use Header now
    const { toast } = useToast();

    const [name, setName] = useState(user?.user_metadata?.username || "");
    const [email, setEmail] = useState(user?.email || "");
    const [issueType, setIssueType] = useState("");
    const [message, setMessage] = useState("");
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
        issueType?: string;
        message?: string;
        rating?: string;
        files?: string;
    }>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const result = supportSchema.safeParse({
            name,
            email,
            issueType,
            message,
            rating,
        });

        if (!result.success) {
            const fieldErrors: typeof errors = {};
            result.error.errors.forEach((err) => {
                const field = err.path[0] as keyof typeof errors;
                fieldErrors[field] = err.message;
            });
            setErrors(fieldErrors);
            return;
        }

        // Validate files
        if (files.length > 0) {
            const maxSize = 10 * 1024 * 1024; // 10MB
            const invalidFiles = files.filter(f => f.size > maxSize);
            if (invalidFiles.length > 0) {
                setErrors({ files: `Some files exceed 10MB limit: ${invalidFiles.map(f => f.name).join(', ')}` });
                return;
            }
        }

        setLoading(true);

        try {
            // Create mailto link with pre-filled content
            const subject = encodeURIComponent(`[${issueType.toUpperCase()}] Support Request from ${name}`);
            let bodyText = `Name: ${name}\nEmail: ${email}\nIssue Type: ${issueTypes.find(t => t.value === issueType)?.label}\nRating: ${rating}/5 stars\n\nMessage:\n${message}`;

            if (files.length > 0) {
                bodyText += `\n\nAttachments (${files.length} file${files.length > 1 ? 's' : ''}):\n${files.map(f => `- ${f.name} (${(f.size / 1024).toFixed(2)} KB)`).join('\n')}`;
                bodyText += `\n\nNote: Please attach the files mentioned above when sending this email.`;
            }

            bodyText += `\n\n---\nSent from AnL Support Form`;
            const body = encodeURIComponent(bodyText);

            const mailtoLink = `mailto:ksoftsol777@gmail.com?subject=${subject}&body=${body}`;

            // Open default email client
            window.location.href = mailtoLink;

            toast({
                title: "Email client opened",
                description: files.length > 0
                    ? `Your email client has been opened. Please attach the ${files.length} file${files.length > 1 ? 's' : ''} before sending.`
                    : "Your default email client has been opened with the pre-filled message. Please send the email to complete your request.",
            });

            // Reset form
            setName("");
            setEmail("");
            setIssueType("");
            setMessage("");
            setRating(0);
            setFiles([]);
        } catch (err) {
            toast({
                title: "Error",
                description: "Something went wrong. Please try again or email us directly at ksoftsol777@gmail.com",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];

        const validFiles = selectedFiles.filter(file => {
            if (!validTypes.includes(file.type)) {
                toast({
                    title: "Invalid file type",
                    description: `${file.name} is not a supported image or video format.`,
                    variant: "destructive",
                });
                return false;
            }
            if (file.size > 10 * 1024 * 1024) {
                toast({
                    title: "File too large",
                    description: `${file.name} exceeds the 10MB limit.`,
                    variant: "destructive",
                });
                return false;
            }
            return true;
        });

        setFiles(prev => [...prev, ...validFiles]);
        setErrors(prev => ({ ...prev, files: undefined }));
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="min-h-screen bg-muted/30">
            <Header />
            <div className="container max-w-4xl pt-24 pb-12">
                {/* Header */}
                <div className="mb-8">
                    {/* Back button removed */}
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                            <MessageSquare className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Customer Support</h1>
                            <p className="text-muted-foreground">We're here to help you</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Form */}
                    <div className="md:col-span-2">
                        <Card variant="elevated">
                            <CardHeader>
                                <CardTitle>Contact Us</CardTitle>
                                <CardDescription>
                                    Fill out the form below and we'll get back to you as soon as possible
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name *</Label>
                                        <Input
                                            id="name"
                                            placeholder="Your full name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className={errors.name ? "border-destructive" : ""}
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">{errors.name}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="your@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={errors.email ? "border-destructive" : ""}
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-destructive">{errors.email}</p>
                                        )}
                                    </div>

                                    {/* Issue Type */}
                                    <div className="space-y-2">
                                        <Label htmlFor="issueType">Issue Type *</Label>
                                        <Select value={issueType} onValueChange={setIssueType}>
                                            <SelectTrigger className={errors.issueType ? "border-destructive" : ""}>
                                                <SelectValue placeholder="Select an issue type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {issueTypes.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.issueType && (
                                            <p className="text-sm text-destructive">{errors.issueType}</p>
                                        )}
                                    </div>

                                    {/* Rating */}
                                    <div className="space-y-2">
                                        <Label>Rate Your Experience *</Label>
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() => setRating(star)}
                                                    onMouseEnter={() => setHoveredRating(star)}
                                                    onMouseLeave={() => setHoveredRating(0)}
                                                    className="transition-transform hover:scale-110"
                                                >
                                                    <Star
                                                        className={`h-8 w-8 ${star <= (hoveredRating || rating)
                                                            ? "fill-yellow-400 text-yellow-400"
                                                            : "text-muted-foreground"
                                                            }`}
                                                    />
                                                </button>
                                            ))}
                                            <span className="ml-2 text-sm text-muted-foreground">
                                                {rating > 0 ? `${rating}/5` : "Not rated"}
                                            </span>
                                        </div>
                                        {errors.rating && (
                                            <p className="text-sm text-destructive">{errors.rating}</p>
                                        )}
                                    </div>

                                    {/* Message */}
                                    <div className="space-y-2">
                                        <Label htmlFor="message">Message *</Label>
                                        <Textarea
                                            id="message"
                                            placeholder="Describe your issue or feedback in detail..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            rows={6}
                                            className={errors.message ? "border-destructive" : ""}
                                        />
                                        {errors.message && (
                                            <p className="text-sm text-destructive">{errors.message}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Minimum 10 characters
                                        </p>
                                    </div>

                                    {/* File Upload */}
                                    <div className="space-y-2">
                                        <Label htmlFor="files">Attach Photos or Videos (Optional)</Label>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    id="files"
                                                    type="file"
                                                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                                                    multiple
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => document.getElementById('files')?.click()}
                                                    className="w-full"
                                                >
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Choose Files
                                                </Button>
                                            </div>
                                            {errors.files && (
                                                <p className="text-sm text-destructive">{errors.files}</p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                                Supported: JPG, PNG, GIF, WebP, MP4, WebM, MOV • Max 10MB per file
                                            </p>

                                            {/* File Preview */}
                                            {files.length > 0 && (
                                                <div className="grid grid-cols-2 gap-2 mt-3">
                                                    {files.map((file, index) => (
                                                        <div
                                                            key={index}
                                                            className="relative group border rounded-lg p-2 bg-muted/50 hover:bg-muted transition-colors"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {file.type.startsWith('image/') ? (
                                                                    <Image className="h-4 w-4 text-primary flex-shrink-0" />
                                                                ) : (
                                                                    <Video className="h-4 w-4 text-primary flex-shrink-0" />
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-medium truncate">{file.name}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {(file.size / 1024).toFixed(2)} KB
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeFile(index)}
                                                                    className="flex-shrink-0 p-1 rounded-full hover:bg-destructive/10 transition-colors"
                                                                >
                                                                    <X className="h-3 w-3 text-destructive" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        variant="hero"
                                        disabled={loading}
                                    >
                                        <Send className="mr-2 h-4 w-4" />
                                        Send Message
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Contact Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium">Email</p>
                                    <a
                                        href="mailto:ksoftsol777@gmail.com"
                                        className="text-sm text-accent hover:underline"
                                    >
                                        ksoftsol777@gmail.com
                                    </a>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Response Time</p>
                                    <p className="text-sm text-muted-foreground">
                                        Usually within 24-48 hours
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Common Issues */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5" />
                                    Common Issues
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li>• Fraud or security concerns</li>
                                    <li>• Technical bugs or errors</li>
                                    <li>• Payment processing issues</li>
                                    <li>• Spam or abuse reports</li>
                                    <li>• Feature suggestions</li>
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Tips */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Tips for Faster Support</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li>• Be specific about your issue</li>
                                    <li>• Include relevant details</li>
                                    <li>• Attach screenshots if applicable</li>
                                    <li>• Provide your account email</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

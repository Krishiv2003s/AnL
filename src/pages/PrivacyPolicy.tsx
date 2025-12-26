import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-24">
                <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
                    <h1>Privacy Policy</h1>
                    <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

                    <h2>1. Introduction</h2>
                    <p>
                        Welcome to AnL (Assets & Liabilities). We respect your privacy and are committed to protecting your personal data.
                        This privacy policy explains how we collect, use, and safeguard your information when you use our financial analysis platform.
                    </p>

                    <h2>2. Information We Collect</h2>
                    <h3>2.1 Personal Information</h3>
                    <p>When you create an account, we collect:</p>
                    <ul>
                        <li>Email address</li>
                        <li>Username</li>
                        <li>Password (encrypted)</li>
                    </ul>

                    <h3>2.2 Financial Documents</h3>
                    <p>When you upload documents for analysis, we process:</p>
                    <ul>
                        <li>Bank statements</li>
                        <li>Form 16 documents</li>
                        <li>Business ledgers</li>
                        <li>Other financial documents you choose to upload</li>
                    </ul>

                    <h3>2.3 Usage Data</h3>
                    <p>We automatically collect:</p>
                    <ul>
                        <li>IP address</li>
                        <li>Browser type and version</li>
                        <li>Pages visited and time spent</li>
                        <li>Device information</li>
                    </ul>

                    <h2>3. How We Use Your Information</h2>
                    <p>We use your data to:</p>
                    <ul>
                        <li>Provide AI-powered financial analysis services</li>
                        <li>Generate balance sheets and tax insights</li>
                        <li>Improve our services and user experience</li>
                        <li>Send important account notifications</li>
                        <li>Comply with legal obligations</li>
                    </ul>

                    <h2>4. Data Security</h2>
                    <p>
                        We implement bank-grade security measures to protect your data:
                    </p>
                    <ul>
                        <li>End-to-end encryption for data transmission</li>
                        <li>Secure cloud storage with Supabase</li>
                        <li>Regular security audits</li>
                        <li>Access controls and authentication</li>
                    </ul>

                    <h2>5. Data Sharing</h2>
                    <p>We do not sell your personal data. We may share information with:</p>
                    <ul>
                        <li><strong>Service Providers:</strong> Supabase (database), Google (AI analysis)</li>
                        <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                    </ul>

                    <h2>6. Third-Party Services</h2>
                    <h3>6.1 Google AdSense</h3>
                    <p>
                        We use Google AdSense to display advertisements. Google may use cookies and web beacons to collect information
                        about your visits to this and other websites to provide targeted advertisements. You can opt out of personalized
                        advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google's Ads Settings</a>.
                    </p>

                    <h3>6.2 Analytics</h3>
                    <p>
                        We may use analytics services to understand how users interact with our platform and improve our services.
                    </p>

                    <h2>7. Your Rights</h2>
                    <p>You have the right to:</p>
                    <ul>
                        <li>Access your personal data</li>
                        <li>Correct inaccurate data</li>
                        <li>Request deletion of your data</li>
                        <li>Export your data</li>
                        <li>Withdraw consent</li>
                    </ul>

                    <h2>8. Data Retention</h2>
                    <p>
                        We retain your data for as long as your account is active or as needed to provide services.
                        You can request deletion of your account and data at any time through the Settings page.
                    </p>

                    <h2>9. Cookies</h2>
                    <p>
                        We use cookies and similar technologies to:
                    </p>
                    <ul>
                        <li>Maintain your session</li>
                        <li>Remember your preferences</li>
                        <li>Analyze site traffic</li>
                        <li>Serve relevant advertisements</li>
                    </ul>

                    <h2>10. Children's Privacy</h2>
                    <p>
                        Our service is not intended for users under 18 years of age. We do not knowingly collect data from children.
                    </p>

                    <h2>11. Changes to This Policy</h2>
                    <p>
                        We may update this privacy policy from time to time. We will notify you of significant changes by email or
                        through a notice on our platform.
                    </p>

                    <h2>12. Contact Us</h2>
                    <p>
                        If you have questions about this privacy policy or our data practices, please contact us through our
                        <a href="/support"> Support page</a>.
                    </p>

                    <h2>13. Governing Law</h2>
                    <p>
                        This privacy policy is governed by the laws of India. Any disputes will be subject to the exclusive
                        jurisdiction of the courts in India.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
}

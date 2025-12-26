import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function TermsConditions() {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container py-24">
                <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
                    <h1>Terms and Conditions</h1>
                    <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

                    <h2>1. Acceptance of Terms</h2>
                    <p>
                        By accessing and using AnL (Assets & Liabilities), you accept and agree to be bound by these Terms and Conditions.
                        If you do not agree to these terms, please do not use our service.
                    </p>

                    <h2>2. Description of Service</h2>
                    <p>
                        AnL provides AI-powered financial analysis services for Indian taxpayers, including:
                    </p>
                    <ul>
                        <li>Document analysis (bank statements, Form 16, ledgers)</li>
                        <li>Automated balance sheet generation</li>
                        <li>Tax filing recommendations (ITR-1 to ITR-4)</li>
                        <li>Financial insights and categorization</li>
                    </ul>

                    <h2>3. User Accounts</h2>
                    <h3>3.1 Registration</h3>
                    <p>
                        To use our services, you must create an account with accurate and complete information. You are responsible
                        for maintaining the confidentiality of your account credentials.
                    </p>

                    <h3>3.2 Account Security</h3>
                    <p>
                        You agree to:
                    </p>
                    <ul>
                        <li>Use a strong, unique password</li>
                        <li>Not share your account with others</li>
                        <li>Notify us immediately of any unauthorized access</li>
                        <li>Be responsible for all activities under your account</li>
                    </ul>

                    <h2>4. Acceptable Use</h2>
                    <p>You agree NOT to:</p>
                    <ul>
                        <li>Upload malicious files or viruses</li>
                        <li>Attempt to gain unauthorized access to our systems</li>
                        <li>Use the service for illegal activities</li>
                        <li>Violate any applicable laws or regulations</li>
                        <li>Reverse engineer or copy our software</li>
                        <li>Upload documents that don't belong to you</li>
                    </ul>

                    <h2>5. Data and Privacy</h2>
                    <p>
                        Your use of AnL is also governed by our <a href="/privacy-policy">Privacy Policy</a>.
                        By using our service, you consent to our data practices as described in the Privacy Policy.
                    </p>

                    <h2>6. Intellectual Property</h2>
                    <h3>6.1 Our Content</h3>
                    <p>
                        All content, features, and functionality of AnL, including but not limited to text, graphics, logos, and software,
                        are owned by us or our licensors and protected by copyright and trademark laws.
                    </p>

                    <h3>6.2 Your Content</h3>
                    <p>
                        You retain ownership of the documents you upload. By uploading content, you grant us a limited license to process
                        and analyze your documents to provide our services.
                    </p>

                    <h2>7. AI-Generated Analysis</h2>
                    <p>
                        <strong>Important Disclaimer:</strong> Our AI-powered analysis is provided for informational purposes only and
                        should not be considered as professional financial or tax advice. We recommend consulting with qualified
                        professionals for specific financial decisions.
                    </p>

                    <h2>8. Accuracy of Information</h2>
                    <p>
                        While we strive for accuracy, we do not guarantee that:
                    </p>
                    <ul>
                        <li>AI analysis will be 100% accurate</li>
                        <li>Tax recommendations will be suitable for your specific situation</li>
                        <li>The service will be error-free or uninterrupted</li>
                    </ul>

                    <h2>9. Third-Party Services</h2>
                    <h3>9.1 Advertisements</h3>
                    <p>
                        Our service displays advertisements through Google AdSense. We are not responsible for the content of these
                        advertisements or the practices of advertisers.
                    </p>

                    <h3>9.2 External Links</h3>
                    <p>
                        We may provide links to third-party websites. We are not responsible for the content or practices of these sites.
                    </p>

                    <h2>10. Limitation of Liability</h2>
                    <p>
                        To the maximum extent permitted by law, AnL shall not be liable for:
                    </p>
                    <ul>
                        <li>Any indirect, incidental, or consequential damages</li>
                        <li>Loss of profits, data, or business opportunities</li>
                        <li>Errors in AI analysis or recommendations</li>
                        <li>Service interruptions or data loss</li>
                    </ul>

                    <h2>11. Indemnification</h2>
                    <p>
                        You agree to indemnify and hold harmless AnL from any claims, damages, or expenses arising from:
                    </p>
                    <ul>
                        <li>Your violation of these terms</li>
                        <li>Your use of the service</li>
                        <li>Your uploaded content</li>
                    </ul>

                    <h2>12. Service Modifications</h2>
                    <p>
                        We reserve the right to:
                    </p>
                    <ul>
                        <li>Modify or discontinue the service at any time</li>
                        <li>Change pricing or features</li>
                        <li>Update these terms and conditions</li>
                    </ul>
                    <p>
                        We will provide reasonable notice of significant changes.
                    </p>

                    <h2>13. Termination</h2>
                    <p>
                        We may suspend or terminate your account if you:
                    </p>
                    <ul>
                        <li>Violate these terms</li>
                        <li>Engage in fraudulent activity</li>
                        <li>Abuse the service</li>
                    </ul>
                    <p>
                        You may terminate your account at any time through the Settings page.
                    </p>

                    <h2>14. Disclaimer of Warranties</h2>
                    <p>
                        THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
                        WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                    </p>

                    <h2>15. Governing Law</h2>
                    <p>
                        These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction
                        of courts in India.
                    </p>

                    <h2>16. Severability</h2>
                    <p>
                        If any provision of these terms is found to be unenforceable, the remaining provisions will continue in full effect.
                    </p>

                    <h2>17. Entire Agreement</h2>
                    <p>
                        These Terms and Conditions, together with our Privacy Policy, constitute the entire agreement between you and AnL.
                    </p>

                    <h2>18. Contact Information</h2>
                    <p>
                        For questions about these terms, please contact us through our <a href="/support">Support page</a>.
                    </p>

                    <h2>19. Acknowledgment</h2>
                    <p>
                        BY USING ANL, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS AND CONDITIONS.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
}

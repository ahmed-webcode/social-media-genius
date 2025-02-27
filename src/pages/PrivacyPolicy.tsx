
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="container max-w-3xl mx-auto py-8 px-4 md:py-12">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/auth" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </Button>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="prose max-w-none">
        <p className="mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
          <p>Welcome to our Service. We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.</p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
          <p>We collect information that you provide directly to us, such as when you create an account, update your profile, use interactive features, make a purchase, or otherwise communicate with us.</p>
          <p className="mt-2">This may include:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>Contact information (name, email address, phone number)</li>
            <li>Authentication information (passwords, security questions)</li>
            <li>Profile information (profile picture, interests)</li>
            <li>Content you create, upload, or share through our platform</li>
            <li>Social media account information when you connect these accounts</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
          <p>We use your information for various purposes, including to:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send administrative messages and communications</li>
            <li>Personalize your experience and content</li>
            <li>Monitor and analyze trends, usage, and activities</li>
            <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">4. Sharing Your Information</h2>
          <p>We may share information about you in the following circumstances:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>With service providers who perform services on our behalf</li>
            <li>With business partners with whom we jointly offer products or services</li>
            <li>In response to legal process or when we believe disclosure is necessary to protect rights</li>
            <li>In connection with a business transaction such as a merger or acquisition</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">5. Social Media and Third-Party Platforms</h2>
          <p>Our service includes integrations with social media platforms such as YouTube, Instagram, TikTok, and Snapchat. When you connect your social media accounts:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>We collect information from these accounts as permitted by your privacy settings</li>
            <li>We may publish content to your connected accounts with your consent</li>
            <li>The third-party platforms' privacy policies govern the data collected by those platforms</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">6. Your Rights and Choices</h2>
          <p>You have several rights regarding your personal information, including:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>Accessing, correcting, or deleting your personal information</li>
            <li>Objecting to our use of your information</li>
            <li>Withdrawing consent at any time</li>
            <li>Opting out of marketing communications</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">7. Data Security</h2>
          <p>We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">8. Changes to This Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">9. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at:</p>
          <p className="mt-2">Email: support@example.com</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

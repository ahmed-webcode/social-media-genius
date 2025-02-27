
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
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
      
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      
      <div className="prose max-w-none">
        <p className="mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p>By accessing or using our service, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this service.</p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">2. Use License</h2>
          <p>Permission is granted to temporarily access and use our service for personal, non-commercial purposes. This license does not include:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>Modifying or copying our materials</li>
            <li>Using the materials for any commercial purpose</li>
            <li>Attempting to decompile or reverse engineer any software contained in our service</li>
            <li>Removing any copyright or other proprietary notations</li>
            <li>Transferring the materials to another person or "mirror" the materials on any other server</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">3. Account Terms</h2>
          <p>To access certain features of our service, you may be required to register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.</p>
          <p className="mt-2">You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password. You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">4. Content Policies</h2>
          <p>Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the content that you post to the service, including its legality, reliability, and appropriateness.</p>
          <p className="mt-2">By posting content to the service, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such content on and through the service. You retain any and all of your rights to any content you submit, post or display on or through the service and you are responsible for protecting those rights.</p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">5. Social Media Integrations</h2>
          <p>Our service provides integrations with third-party services, such as YouTube, Instagram, TikTok, and Snapchat. By using these integrations:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>You authorize us to access and interact with your social media accounts on your behalf</li>
            <li>You agree to comply with the terms of service of those third-party platforms</li>
            <li>You acknowledge that we are not responsible for the content, privacy policies, or practices of any third-party services</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">6. Limitations</h2>
          <p>In no event shall we be liable for any damages arising out of the use or inability to use our materials, even if we have been notified orally or in writing of the possibility of such damage.</p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">7. Revisions and Errors</h2>
          <p>The materials appearing on our service could include technical, typographical, or photographic errors. We do not warrant that any of the materials on our service are accurate, complete, or current. We may make changes to the materials contained on its service at any time without notice.</p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">8. Termination</h2>
          <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the service will immediately cease.</p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">9. Governing Law</h2>
          <p>These Terms shall be governed and construed in accordance with the laws, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.</p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">10. Changes to Terms</h2>
          <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice prior to any new terms taking effect. By continuing to access or use our service after those revisions become effective, you agree to be bound by the revised terms.</p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at:</p>
          <p className="mt-2">Email: support@example.com</p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;

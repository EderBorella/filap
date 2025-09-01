import React, { useState } from 'react';
import { useToast } from '../../components/Toast';
import './Contact.scss';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      showError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create mailto link with form data
      const subject = encodeURIComponent(formData.subject || 'Contact from Filap');
      const body = encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
      );
      const mailtoLink = `mailto:ederlopesborella@gmail.com?subject=${subject}&body=${body}`;
      
      // Open user's email client
      window.location.href = mailtoLink;
      
      // Reset form
      setFormData({ name: '', email: '', subject: '', message: '' });
      showSuccess('Email client opened! Please send the email from your email app.');
      
    } catch (error) {
      console.error('Error opening email client:', error);
      showError('Failed to open email client. Please contact ederlopesborella@gmail.com directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact">
      <div className="contact__container">
        {/* Header Section */}
        <div className="contact__header">
          <h1 className="contact__title">Get in Touch</h1>
          <p className="contact__subtitle">
            Have questions about Filap, want to collaborate or report bugs? I'd love to hear from you!
          </p>
        </div>

        <div className="contact__content">
          {/* Developer Info Section */}
          <div className="contact__info">
            <div className="contact__profile">
              <div className="contact__avatar">
                <div className="contact__avatar-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              </div>
              
              <div className="contact__details">
                <h2 className="contact__name">Eder Borella</h2>
                <p className="contact__role">Software Engineer</p>
                
                <div className="contact__description">
                  <p>
                    I'm a software engineer who loves building things that work well and make a difference. 
                    By day, I work with my team to tackle complex problems for the company. I don't really have a favorite
                    tech stack, I'm always excited to learn new tools. I'm much more about using the right language or framework 
                    for the job, whatever helps me build the best solution. I've always been drawn to tough challenges; 
                    difficult problems are what really engage and motivate me.
                  </p>
                  <p>
                    My real passion, though, is using these skills for projects that solve tangible, real-world problems.
                     I believe the best tech is the kind that feels helpful and intuitive, making someone's day a 
                     little easier or a lot more fun. It's not just about the code, it's about the people using it.
                  </p>
                  <p>
                    This drive is what led me to create projects like Arcane Desk, a web app I built from 
                    the ground up to help my RPG group manage our chaotic game nights. It even uses a self-hosted 
                    AI to generate characters! I'm also tinkering with an Automated Greenhouse on a Raspberry Pi, 
                    just for the joy of mixing hardware and software to grow things. 
                    For me, building is the best way to learn and help.
                  </p>
                </div>

                {/* Social Links */}
                <div className="contact__social">
                  <a 
                    href="https://github.com/EderBorella" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="contact__social-link"
                    aria-label="GitHub Profile"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </a>
                  
                  <a 
                    href="https://www.linkedin.com/in/eder-borella/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="contact__social-link"
                    aria-label="LinkedIn Profile"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </a>
                </div>

                {/* Direct Contact */}
                <div className="contact__direct">
                  <p className="contact__email">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                    ederlopesborella@gmail.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="contact__form-section">
            <h3 className="contact__form-title">Send me a message</h3>
            
            <form className="contact__form" onSubmit={handleSubmit}>
              <div className="contact__form-group">
                <label htmlFor="name" className="contact__label">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="contact__input"
                  placeholder="Your full name"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="contact__form-group">
                <label htmlFor="email" className="contact__label">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="contact__input"
                  placeholder="your.email@example.com"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="contact__form-group">
                <label htmlFor="subject" className="contact__label">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="contact__input"
                  placeholder="What's this about?"
                  disabled={isSubmitting}
                />
              </div>

              <div className="contact__form-group">
                <label htmlFor="message" className="contact__label">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="contact__textarea"
                  placeholder="Tell me about your project, question, or just say hello..."
                  rows={6}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                className={`btn btn--primary contact__submit ${isSubmitting ? 'btn--loading' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Opening Email...' : 'Send Message'}
              </button>
            </form>

            <p className="contact__form-note">
              This form will open your default email client with the message pre-filled. 
              If it doesn't work, feel free to email me directly at{' '}
              <a href="mailto:ederlopesborella@gmail.com" className="contact__email-link">
                ederlopesborella@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
"use client";

import { FormEvent, useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";

type ContactStatus = "idle" | "sending" | "sent" | "error";

const DEFAULT_CONTACT_HERO = "/hero.png";

export default function ContactPageClient({ heroImageUrl }: { heroImageUrl: string }) {
  const [contactStatus, setContactStatus] = useState<ContactStatus>("idle");
  const src = heroImageUrl?.trim() || DEFAULT_CONTACT_HERO;

  const onContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    setContactStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to submit contact form");
      }

      form.reset();
      setContactStatus("sent");
      setTimeout(() => setContactStatus("idle"), 5000);
    } catch {
      setContactStatus("error");
      setTimeout(() => setContactStatus("idle"), 5000);
    }
  };

  return (
    <main style={{ paddingTop: "120px" }}>
      <section className="hero" style={{ height: "40vh" }}>
        <div className="hero-bg">
          <img src={src} alt="Contact RauVei" style={{ filter: "brightness(0.6)" }} />
        </div>
        <div className="hero-content" style={{ textAlign: "center" }}>
          <h2 className="hero-subtitle fadeIn">Boutique Concierge</h2>
          <h1 className="hero-title fadeIn" style={{ animationDelay: "0.2s" }}>Contact Us</h1>
        </div>
      </section>

      <section className="section-padding" style={{ background: "var(--bg-offset)" }}>
        <div className="container" style={{ maxWidth: "1000px" }}>
          <div style={{ textAlign: "center", marginBottom: "80px" }}>
            <h2 className="section-title" style={{ fontSize: "3rem", marginBottom: "20px" }}>Boutique Consultations</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto", lineHeight: "1.8" }}>
              Experience personalized fashion guidance. Whether you&apos;re seeking a custom piece or need assistance with sizing, our concierge team is at your service.
            </p>
          </div>

          <div style={{
            background: "#ffffff",
            padding: "80px",
            boxShadow: "var(--shadow-md)",
            border: "1px solid rgba(0,0,0,0.03)"
          }}>
            <form onSubmit={onContactSubmit} style={{ display: "grid", gap: "40px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input type="text" id="name" name="name" placeholder="E.g. John Doe" required />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input type="email" id="email" name="email" placeholder="john@example.com" required />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="subject">Subject of Enquiry</label>
                <input type="text" id="subject" name="subject" placeholder="What are you interested in?" required />
              </div>
              <div className="form-group">
                <label htmlFor="message">Your Message</label>
                <textarea id="message" name="message" placeholder="Describe how we can assist you..." rows={4} required />
              </div>
              <div style={{ paddingTop: "20px" }}>
                <button
                  type="submit"
                  className={`btn btn-primary ${
                    contactStatus === "sent" ? "btn-success" : ""
                  }`}
                  disabled={contactStatus === "sending"}
                  style={{ width: "100%", height: "64px", fontSize: "0.8rem" }}
                >
                  {contactStatus === "sending" ? (
                    "Processing Your Request..."
                  ) : contactStatus === "sent" ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <CheckCircle size={20} strokeWidth={1.5} /> Request Received
                    </span>
                  ) : (
                    <span style={{ display: "flex", alignItems: "center", gap: "10px", letterSpacing: "0.2em" }}>
                       Submit Your Enquiry
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "40px",
            marginTop: "80px",
            textAlign: "center"
          }}>
            <div className="fadeIn" style={{ animationDelay: "0.2s" }}>
              <MapPin size={20} style={{ color: "var(--primary)", marginBottom: "16px" }} />
              <h4 style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "8px" }}>Visit Us</h4>
              <p style={{ fontWeight: "700", fontSize: "0.9rem" }}>Windhoek, Namibia</p>
            </div>
            <div className="fadeIn" style={{ animationDelay: "0.4s" }}>
              <Mail size={20} style={{ color: "var(--primary)", marginBottom: "16px" }} />
              <h4 style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "8px" }}>Direct Email</h4>
              <a href="mailto:sales@rauvei.com" style={{ fontWeight: "700", fontSize: "0.9rem" }}>sales@rauvei.com</a>
            </div>
            <div className="fadeIn" style={{ animationDelay: "0.6s" }}>
              <Phone size={20} style={{ color: "var(--primary)", marginBottom: "16px" }} />
              <h4 style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "8px" }}>Concierge</h4>
              <a href="tel:+264812860088" style={{ fontWeight: "700", fontSize: "0.9rem" }}>+264 81 286 0088</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// Configuration: in production on Vercel, this should point to the serverless function.
// For local testing without a backend, you can leave it empty and submissions will log to console.
const FORM_ENDPOINT_URL = "/api/contact";

function initCurrentYear() {
  const yearEl = document.getElementById("current-year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
}

function initNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("primary-nav");

  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#" || href === "#top") return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      const header = document.querySelector(".site-header");
      const headerHeight = header instanceof HTMLElement ? header.offsetHeight : 0;
      const rect = target.getBoundingClientRect();
      const offsetTop = rect.top + window.scrollY - headerHeight - 12;

      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    });
  });
}

function validateEmail(value) {
  if (!value) return "Email is required.";
  const simplePattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!simplePattern.test(value)) return "Please enter a valid email address.";
  return "";
}

function validateRequired(value, label) {
  if (!value || !value.trim()) {
    return `${label} is required.`;
  }
  return "";
}

function setFieldError(id, message) {
  const errorEl = document.getElementById(id);
  if (!errorEl) return;
  errorEl.textContent = message;
}

function clearFieldErrors() {
  setFieldError("name-error", "");
  setFieldError("email-error", "");
  setFieldError("message-error", "");
}

function setFormStatus(message, type) {
  const statusEl = document.getElementById("form-status");
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.classList.remove("form-status--success", "form-status--error");

  if (type === "success") {
    statusEl.classList.add("form-status--success");
  } else if (type === "error") {
    statusEl.classList.add("form-status--error");
  }
}

function gatherFormData(form) {
  const formData = new FormData(form);
  const data = {};

  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }

  return data;
}

async function submitForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return;

  clearFieldErrors();
  setFormStatus("", "");

  const nameInput = form.querySelector("#name");
  const emailInput = form.querySelector("#email");
  const messageInput = form.querySelector("#message");
  const honeypotInput = form.querySelector("#companyWebsite");
  const submitButton = document.getElementById("submit-button");

  const nameValue = nameInput instanceof HTMLInputElement ? nameInput.value : "";
  const emailValue = emailInput instanceof HTMLInputElement ? emailInput.value : "";
  const messageValue =
    messageInput instanceof HTMLTextAreaElement ? messageInput.value : "";
  const hpValue = honeypotInput instanceof HTMLInputElement ? honeypotInput.value : "";

  const nameError = validateRequired(nameValue, "Name");
  const emailError = validateEmail(emailValue);
  const messageError = validateRequired(messageValue, "Project details");

  let hasError = false;
  if (nameError) {
    setFieldError("name-error", nameError);
    hasError = true;
  }
  if (emailError) {
    setFieldError("email-error", emailError);
    hasError = true;
  }
  if (messageError) {
    setFieldError("message-error", messageError);
    hasError = true;
  }

  if (hasError) {
    setFormStatus("Please correct the fields highlighted above.", "error");
    return;
  }

  if (hpValue) {
    // Honeypot filled: treat as spam, pretend success.
    form.reset();
    setFormStatus(
      "Thanks for reaching out. If this was a real inquiry, I’ll get back to you shortly.",
      "success"
    );
    return;
  }

  if (submitButton instanceof HTMLButtonElement) {
    submitButton.disabled = true;
  }

  const payload = gatherFormData(form);

  try {
    if (!FORM_ENDPOINT_URL) {
      console.warn(
        "FORM_ENDPOINT_URL is not configured. Form submission is being logged locally instead of sent to a backend.",
        payload
      );
      setFormStatus(
        "Thanks for your message. In a live deployment, this would be sent to your configured contact endpoint.",
        "success"
      );
      form.reset();
      return;
    }

    const response = await fetch(FORM_ENDPOINT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Unexpected response: ${response.status}`);
    }

    setFormStatus(
      "Thank you—your message has been sent. I’ll follow up within 1–2 business days.",
      "success"
    );
    form.reset();
  } catch (error) {
    console.error("Error submitting contact form", error);
    setFormStatus(
      "Something went wrong sending your message. Please try again in a few minutes or email hello@dtsoftware.dev.",
      "error"
    );
  } finally {
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = false;
    }
  }
}

function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!(form instanceof HTMLFormElement)) return;

  form.addEventListener("submit", submitForm);
}

document.addEventListener("DOMContentLoaded", () => {
  initCurrentYear();
  initNavToggle();
  initSmoothScroll();
  initContactForm();
});



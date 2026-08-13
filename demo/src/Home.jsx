import { useState } from "react";

const SUBMIT_ENDPOINT = "https://qpwmfbviwpjtwcqbpkky.supabase.co/functions/v1/submit-interest";

// Canonical PreQualy link — used in every share message and as the URL
// platforms fetch Open Graph data from (never window.location.href, which
// can be a local/dev path with no OG tags, e.g. localhost during testing).
const PREQUALY_SHARE_URL = "https://prequaly.com/";

function SuccessPanel() {
  const [igCopied, setIgCopied] = useState(false);

  const xText = `I just joined the @PreQualyInc interest list — PreQualy is unlocking opportunities for homeownership to millions. Join me: ${PREQUALY_SHARE_URL}`;
  const igText = `I just joined the @_prequaly interest list — PreQualy is unlocking opportunities for homeownership to millions. Join me: ${PREQUALY_SHARE_URL}`;

  // Instagram has no web share-intent that accepts prefilled caption text,
  // so we copy the caption to the clipboard and hand the user off to the
  // PreQualy profile to paste it into a post.
  const shareToInstagram = async () => {
    try {
      await navigator.clipboard.writeText(igText);
      setIgCopied(true);
      setTimeout(() => setIgCopied(false), 2500);
    } catch {
      /* clipboard unavailable — Instagram still opens, caption just isn't pre-copied */
    }
    window.open("https://www.instagram.com/_prequaly/", "_blank", "noopener");
  };

  return (
    <div className="form-panel">
      <div className="success">
        <div className="success-icon" aria-hidden="true">&#10003;</div>
        <h2 tabIndex="-1">Thank You for Joining the PreQualy Interest List!</h2>
        <p>Your information has been successfully submitted. Please check your inbox for a confirmation email.</p>
        <p>
          We will keep you informed about PreQualy&rsquo;s launch, platform updates,
          early-access opportunities, and resources that may support your homeownership
          journey or your work in the housing industry.
        </p>
        <p>We look forward to connecting with you.</p>
        <div className="share-row">
          <a
            className="button button-primary"
            target="_blank"
            rel="noopener noreferrer"
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(xText)}`}
          >
            Share on X
          </a>
          <button
            type="button"
            className="button button-secondary"
            onClick={shareToInstagram}
          >
            {igCopied ? "Caption Copied!" : "Share on Instagram"}
          </button>
        </div>
        <button
          type="button"
          className="button button-secondary"
          style={{ marginTop: "14px" }}
          onClick={() => window.location.reload()}
        >
          Return to the top
        </button>
      </div>
    </div>
  );
}

function Home({ go }) {
  const [activeForm, setActiveForm] = useState(null);
  const [formSteps, setFormSteps] = useState({
    homebuyerForm: 0,
    professionalForm: 0,
    governmentForm: 0,
    nonprofitForm: 0,
  });
  const [submitted, setSubmitted] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  async function submitInterest(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    // Honeypot — if filled by a bot, silently succeed without submitting
    const hp = form.querySelector('input[name="company_website"]');
    if (hp && hp.value.trim() !== "") {
      setSubmitted(formId);
      return;
    }

    const payload = Object.fromEntries(new FormData(form).entries());
    payload.interests = [...form.querySelectorAll('input[name="interests"]:checked')].map((c) => c.value);
    delete payload.company_website;

    const body = {
      audience: form.dataset.formName,
      submittedAt: new Date().toISOString(),
      source: "interest-landing-page",
      ...payload,
    };

    setSubmitting(true);
    setFormErrors((prev) => ({ ...prev, [formId]: "" }));

    try {
      const res = await fetch(SUBMIT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let msg = "Something went wrong. Please try again.";
        try {
          const j = await res.json();
          if (j.error) msg = j.error;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }

      setSubmitted(formId);
    } catch (e) {
      setFormErrors((prev) => ({
        ...prev,
        [formId]: e.message || "Something went wrong submitting your information. Please try again, or email support@prequaly.ai.",
      }));
    } finally {
      setSubmitting(false);
    }
  }

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const openForm = (formId) => {
    setActiveForm(formId);
    setFormSteps((prev) => ({
      ...prev,
      [formId]: 0,
    }));

    setTimeout(() => {
      document.getElementById("forms")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const closeForm = () => {
    setActiveForm(null);
  };

  const nextStep = (formId, totalSteps = 3) => {
    setFormSteps((prev) => ({
      ...prev,
      [formId]: Math.min(prev[formId] + 1, totalSteps - 1),
    }));
  };

  const previousStep = (formId) => {
    setFormSteps((prev) => ({
      ...prev,
      [formId]: Math.max(prev[formId] - 1, 0),
    }));
  };

  const currentStep = (formId) => formSteps[formId] || 0;

  return (
    <>
        <a className="skip-link" href="#roles">Skip to sign-up</a>
        <main id="top">

        {/* =========================================================
            HERO
        ========================================================= */}
        <section className="hero" id="about">
            <div className="container hero-grid">

            <div>
                <p className="eyebrow">
                Unlocking Opportunities for Homeownership To Millions
                </p>

                <h1>
                The Future of{" "}
                <span className="accent">Homeownership</span> Starts Here
                </h1>

                <p className="hero-copy">
                PreQualy is building an AI-powered platform that connects future
                homebuyers, real estate professionals, nonprofits, and government
                agencies to homeownership programs and opportunities that are
                often difficult to find.
                </p>

                <div className="hero-actions">
                <button
                    className="button button-primary"
                    onClick={() => scrollTo("roles")}
                >
                    Join the Interest List
                </button>

                <button
                    className="button button-secondary"
                    onClick={() => scrollTo("journey")}
                >
                    See the Journey
                </button>
                </div>

                <div className="hero-benefits">

                {/* Benefit 1 */}
                <div className="mini-benefit">
                    <div className="mini-icon" aria-hidden="true">
                    <svg
                        viewBox="0 0 24 24"
                        width="22"
                        height="22"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="9" />
                        <circle cx="12" cy="12" r="3" />
                        <line x1="12" y1="1" x2="12" y2="5" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="1" y1="12" x2="5" y2="12" />
                        <line x1="19" y1="12" x2="23" y2="12" />
                    </svg>
                    </div>

                    <div>
                    <strong>AI-powered matching</strong>
                    <span>Find the right programs and partners.</span>
                    </div>
                </div>

                {/* Benefit 2 */}
                <div className="mini-benefit">
                    <div className="mini-icon" aria-hidden="true">
                    <svg
                        viewBox="0 0 24 24"
                        width="22"
                        height="22"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                        <polyline points="2 17 12 22 22 17" />
                        <polyline points="2 12 12 17 22 12" />
                    </svg>
                    </div>

                    <div>
                    <strong>Centralized resources</strong>
                    <span>Housing opportunities in one place.</span>
                    </div>
                </div>

                {/* Benefit 3 */}
                <div className="mini-benefit">
                    <div className="mini-icon" aria-hidden="true">
                    <svg
                        viewBox="0 0 24 24"
                        width="22"
                        height="22"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    </div>

                    <div>
                    <strong>Stronger communities</strong>
                    <span>
                        Equitable access to homeownership for all.
                    </span>
                    </div>
                </div>

                </div>
            </div>

            {/* HERO VISUAL */}
            <div className="hero-visual" aria-hidden="true">
                <svg
                className="hero-illustration"
                viewBox="0 0 600 540"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="A multicultural family standing in front of homes beneath a glowing keyhole"
                >
                {/* Ground */}
                <ellipse
                    cx="300"
                    cy="452"
                    rx="290"
                    ry="46"
                    fill="#E4F8FB"
                />

                <line
                    x1="30"
                    y1="452"
                    x2="570"
                    y2="452"
                    stroke="#CDE9EE"
                    strokeWidth="2"
                />

                {/* Houses */}
                <g>

                    {/* Left house */}
                    <rect
                    x="70"
                    y="330"
                    width="120"
                    height="122"
                    rx="6"
                    fill="#0D2E45"
                    />

                    <path
                    d="M60 332 L130 286 L200 332 Z"
                    fill="#19C9DB"
                    />

                    <rect
                    x="92"
                    y="360"
                    width="30"
                    height="30"
                    rx="4"
                    fill="#41DCEC"
                    />

                    <rect
                    x="138"
                    y="360"
                    width="30"
                    height="30"
                    rx="4"
                    fill="#41DCEC"
                    />

                    <rect
                    x="112"
                    y="404"
                    width="36"
                    height="48"
                    rx="4"
                    fill="#123B57"
                    />

                    {/* Right house */}
                    <rect
                    x="410"
                    y="316"
                    width="130"
                    height="136"
                    rx="6"
                    fill="#0A2233"
                    />

                    <path
                    d="M400 318 L475 268 L550 318 Z"
                    fill="#19C9DB"
                    />

                    <rect
                    x="432"
                    y="348"
                    width="32"
                    height="32"
                    rx="4"
                    fill="#41DCEC"
                    />

                    <rect
                    x="486"
                    y="348"
                    width="32"
                    height="32"
                    rx="4"
                    fill="#41DCEC"
                    />

                    <rect
                    x="452"
                    y="398"
                    width="40"
                    height="54"
                    rx="4"
                    fill="#123B57"
                    />

                    {/* Center house */}
                    <rect
                    x="250"
                    y="356"
                    width="100"
                    height="96"
                    rx="6"
                    fill="#123B57"
                    />

                    <path
                    d="M242 358 L300 320 L358 358 Z"
                    fill="#0FA6B8"
                    />

                    <rect
                    x="284"
                    y="384"
                    width="32"
                    height="30"
                    rx="4"
                    fill="#41DCEC"
                    />
                </g>

                {/* Trees */}
                <g fill="#1FB980">
                    <circle cx="36" cy="404" r="26" />
                    <rect
                    x="32"
                    y="424"
                    width="8"
                    height="30"
                    fill="#0D2E45"
                    />

                    <circle cx="566" cy="410" r="24" />
                    <rect
                    x="562"
                    y="428"
                    width="8"
                    height="26"
                    fill="#0D2E45"
                    />
                </g>

                {/* Keyhole */}
                <circle
                    cx="300"
                    cy="150"
                    r="96"
                    fill="#19C9DB"
                />

                <g fill="#EAFCFF">
                    <circle cx="300" cy="128" r="26" />
                    <path d="M289 146 h22 l10 52 h-42 z" />
                </g>

                {/* Family */}
                <g>

                    {/* Adult 1 */}
                    <g transform="translate(214,372)">
                    <rect
                        x="-22"
                        y="30"
                        width="44"
                        height="70"
                        rx="20"
                        fill="#19C9DB"
                    />
                    <circle
                        cx="0"
                        cy="8"
                        r="20"
                        fill="#8D5524"
                    />
                    </g>

                    {/* Adult 2 */}
                    <g transform="translate(386,372)">
                    <rect
                        x="-22"
                        y="30"
                        width="44"
                        height="70"
                        rx="20"
                        fill="#0D2E45"
                    />
                    <circle
                        cx="0"
                        cy="8"
                        r="20"
                        fill="#C68642"
                    />
                    </g>

                    {/* Child 1 */}
                    <g transform="translate(268,400)">
                    <rect
                        x="-16"
                        y="24"
                        width="32"
                        height="48"
                        rx="14"
                        fill="#F2A93B"
                    />
                    <circle
                        cx="0"
                        cy="6"
                        r="15"
                        fill="#E0AC69"
                    />
                    </g>

                    {/* Child 2 */}
                    <g transform="translate(332,402)">
                    <rect
                        x="-15"
                        y="24"
                        width="30"
                        height="46"
                        rx="13"
                        fill="#1FB980"
                    />
                    <circle
                        cx="0"
                        cy="6"
                        r="14"
                        fill="#F1C27D"
                    />
                    </g>

                </g>
                </svg>
            </div>
            </div>
        </section>


        {/* =========================================================
            ROLES
        ========================================================= */}
        <section className="section" id="roles">
            <div className="container">

            <div className="section-heading">
                <p className="eyebrow">Join the Interest List</p>

                <h2>Choose Your Role</h2>

                <p>
                Tell us who you are so we can keep you informed about what
                matters most to you. You will be taken to a short, tailored
                questionnaire so PreQualy can share relevant updates,
                early-access opportunities, and future pilot information.
                </p>
            </div>

            <div className="role-shell">
                <div className="role-grid">

                {/* HOME BUYER */}
                <article className="role-card homebuyer">
                    <div className="role-icon" aria-hidden="true">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M3 10.5 12 3l9 7.5" />
                        <path d="M5 9.5V21h14V9.5" />
                        <path d="M10 21v-6h4v6" />
                    </svg>
                    </div>

                    <h3>Future Homebuyer</h3>

                    <p>
                    Find opportunities you may not know exist.
                    </p>

                    <ul>
                    <li>Access programs &amp; grants</li>
                    <li>Get matched with resources</li>
                    <li>Be first to know when we launch</li>
                    </ul>

                    <button
                    className="button role-button"
                    onClick={() => openForm("homebuyerForm")}
                    >
                    Join as a Homebuyer →
                    </button>
                </article>


                {/* PROFESSIONAL */}
                <article className="role-card professional">
                    <div className="role-icon" aria-hidden="true">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect
                        x="2"
                        y="7"
                        width="20"
                        height="14"
                        rx="2"
                        />
                        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <path d="M2 13h20" />
                    </svg>
                    </div>

                    <h3>Real Estate Professional</h3>

                    <p>
                    Help more clients become homeowners.
                    </p>

                    <ul>
                    <li>Get qualified buyer leads</li>
                    <li>Access program insights</li>
                    <li>Grow your business</li>
                    </ul>

                    <button
                    className="button role-button"
                    onClick={() => openForm("professionalForm")}
                    >
                    Join as a Professional →
                    </button>
                </article>


                {/* GOVERNMENT */}
                <article className="role-card government">
                    <div className="role-icon" aria-hidden="true">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M3 21h18" />
                        <path d="M5 21V10M9.5 21V10M14.5 21V10M19 21V10" />
                        <path d="M12 3 3 8h18L12 3z" />
                    </svg>
                    </div>

                    <h3>Government Agency</h3>

                    <p>
                    Increase awareness and utilization of your programs.
                    </p>

                    <ul>
                    <li>Improve program visibility</li>
                    <li>Measure community impact</li>
                    <li>Explore future collaboration</li>
                    </ul>

                    <button
                    className="button role-button"
                    onClick={() => openForm("governmentForm")}
                    >
                    Join as an Agency →
                    </button>
                </article>


                {/* NONPROFIT */}
                <article className="role-card nonprofit">
                    <div className="role-icon" aria-hidden="true">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                    </svg>
                    </div>

                    <h3>Nonprofit Organization</h3>

                    <p>
                    Expand your impact in the community.
                    </p>

                    <ul>
                    <li>Connect clients to resources</li>
                    <li>Build stronger partnerships</li>
                    <li>Increase your reach</li>
                    </ul>

                    <button
                    className="button role-button"
                    onClick={() => openForm("nonprofitForm")}
                    >
                    Join as a Nonprofit →
                    </button>
                </article>

                </div>
            </div>
            </div>
        </section>


        {/* =========================================================
            JOURNEY
        ========================================================= */}
        <section className="section" id="journey">
            <div className="container">

            <div className="section-heading">
                <p className="eyebrow">Simple and tailored</p>

                <h2>Your Journey with PreQualy</h2>
            </div>

            <div className="journey">
                <div className="journey-track">

                <div className="journey-step">
                    <div className="journey-icon" aria-hidden="true">
                    1
                    </div>
                    <h3>Discover</h3>
                    <p>
                    You hear about PreQualy and visit our interest page.
                    </p>
                </div>

                <div className="journey-step">
                    <div className="journey-icon" aria-hidden="true">
                    2
                    </div>
                    <h3>Choose Your Role</h3>
                    <p>
                    Select the role that best describes you.
                    </p>
                </div>

                <div className="journey-step">
                    <div className="journey-icon" aria-hidden="true">
                    3
                    </div>
                    <h3>Share Information</h3>
                    <p>
                    Complete a short questionnaire so we can personalize
                    your experience.
                    </p>
                </div>

                <div className="journey-step">
                    <div className="journey-icon" aria-hidden="true">
                    4
                    </div>
                    <h3>You're on the List</h3>
                    <p>
                    You'll receive updates, early access, and opportunities
                    tailored to you.
                    </p>
                </div>

                <div className="journey-step">
                    <div className="journey-icon" aria-hidden="true">
                    5
                    </div>
                    <h3>Stay Informed</h3>
                    <p>
                    Be the first to know when PreQualy launches in your area.
                    </p>
                </div>

                <div className="journey-step">
                    <div className="journey-icon" aria-hidden="true">
                    6
                    </div>
                    <h3>Shape the Future</h3>
                    <p>
                    Participate in pilots, share feedback, and help us build
                    what you need.
                    </p>
                </div>

                </div>
            </div>
            </div>
        </section>


        {/* =========================================================
            FORMS
        ========================================================= */}
        <section
            className="section form-area"
            id="forms"
            aria-live="polite"
        >
            <div className="container">


            {/* =====================================================
                HOME BUYER FORM
            ===================================================== */}
            {activeForm === "homebuyerForm" && (
                submitted === "homebuyerForm" ? (
                <SuccessPanel />
                ) : (
                <form
                className="form-panel multi-step-form"
                id="homebuyerForm"
                data-form-name="Future Homebuyer"
                onSubmit={(e) => e.preventDefault()}
                >
                <div className="form-panel-header">
                    <div>
                    <p className="eyebrow">Future Homebuyer</p>

                    <h2 tabIndex="-1">
                        Tell us about your homeownership goals
                    </h2>

                    <p>
                        Your responses help us understand where to launch and
                        what resources matter most.
                    </p>
                    </div>

                    <button
                    type="button"
                    className="close-form"
                    aria-label="Close form"
                    onClick={closeForm}
                    >
                    ×
                    </button>
                </div>

                <div className="progress" aria-hidden="true">
                    <span className={currentStep("homebuyerForm") === 0 ? "active" : ""}></span>
                    <span className={currentStep("homebuyerForm") === 1 ? "active" : ""}></span>
                    <span className={currentStep("homebuyerForm") === 2 ? "active" : ""}></span>
                </div>

                <div className="hp-field" aria-hidden="true">
                    <label>
                    Do not fill this field
                    <input
                        type="text"
                        name="company_website"
                        tabIndex="-1"
                        autoComplete="off"
                    />
                    </label>
                </div>


                {/* Step 1 */}
                <div className={"form-step" + (currentStep("homebuyerForm") === 0 ? " active" : "")}>
                    <div className="field-grid">

                        <label className="field">
                        <span className="lbl">Full Name</span>
                        <input
                            name="fullName"
                            required
                            autoComplete="name"
                        />
                        </label>

                        <label className="field">
                        <span className="lbl">Email Address</span>
                        <input
                            type="email"
                            name="email"
                            required
                            autoComplete="email"
                        />
                        </label>

                        <label className="field">
                        <span className="lbl">
                            Phone Number <span className="opt">(Optional)</span>
                        </span>

                        <input
                            type="tel"
                            name="phone"
                            autoComplete="tel"
                            placeholder="(123) 456-7890"
                        />
                        </label>

                        <label className="field">
                        <span className="lbl">State</span>

                        <select name="state" id="hb-state" required>
                            <option value="">Select your state</option>
                            {states.map((state) => (
                            <option key={state} value={state}>
                                {state}
                            </option>
                            ))}
                        </select>
                        </label>

                        <label className="field">
                        <span className="lbl">County</span>

                        <input
                            name="county"
                            id="hb-county"
                            list="hb-county-list"
                            placeholder="Enter county"
                            required
                            autoComplete="off"
                        />

                        <datalist id="hb-county-list"></datalist>
                        </label>

                    </div>
                    </div>


                {/* Step 2 */}
                <div className={"form-step" + (currentStep("homebuyerForm") === 1 ? " active" : "")}>
                    <div className="field-grid">

                        <label className="field">
                        <span className="lbl">
                            When are you hoping to purchase?
                        </span>

                        <select name="timeline">
                            <option>Within 6 months</option>
                            <option>6–12 months</option>
                            <option>1–2 years</option>
                            <option>More than 2 years</option>
                            <option>Just exploring</option>
                        </select>
                        </label>

                        <label className="field">
                        <span className="lbl">
                            First-time homebuyer?
                        </span>

                        <select name="firstTime">
                            <option>Yes</option>
                            <option>No</option>
                            <option>Not sure</option>
                        </select>
                        </label>

                        <label className="field">
                        <span className="lbl">Household Size</span>
                        <input
                            type="number"
                            min="1"
                            name="householdSize"
                        />
                        </label>

                        <label className="field">
                        <span className="lbl">
                            Current Housing Status
                        </span>

                        <select name="housingStatus">
                            <option>Renting</option>
                            <option>Living with family</option>
                            <option>Own a home</option>
                            <option>Other</option>
                        </select>
                        </label>

                    </div>
                    </div>


                {/* Step 3 */}
                <div className={"form-step" + (currentStep("homebuyerForm") === 2 ? " active" : "")}>
                    <div className="field full">
                        <span className="lbl">
                        What are you most interested in?
                        </span>

                        <div className="checkbox-grid">

                        <label className="check">
                            <input
                            type="checkbox"
                            name="interests"
                            value="Down Payment Assistance"
                            />
                            Down payment assistance
                        </label>

                        <label className="check">
                            <input
                            type="checkbox"
                            name="interests"
                            value="First-Time Homebuyer Programs"
                            />
                            First-time homebuyer programs
                        </label>

                        <label className="check">
                            <input
                            type="checkbox"
                            name="interests"
                            value="Affordable Homeownership"
                            />
                            Affordable homeownership options
                        </label>

                        <label className="check">
                            <input
                            type="checkbox"
                            name="interests"
                            value="Community Land Trusts"
                            />
                            Community land trusts
                        </label>

                        <label className="check">
                            <input
                            type="checkbox"
                            name="interests"
                            value="Shared Equity"
                            />
                            Shared equity programs
                        </label>

                        <label className="check">
                            <input
                            type="checkbox"
                            name="interests"
                            value="Housing Counseling"
                            />
                            Housing counseling and education
                        </label>

                        </div>
                    </div>
                    </div>

                <div className="form-actions">

                    {currentStep("homebuyerForm") > 0 && (
                    <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => previousStep("homebuyerForm")}
                    >
                        Back
                    </button>
                    )}

                    {currentStep("homebuyerForm") < 2 ? (
                    <button
                        type="button"
                        className="button button-primary"
                        onClick={() => nextStep("homebuyerForm")}
                    >
                        Next
                    </button>
                    ) : (
                    <button
                        type="button"
                        className="button button-primary"
                        disabled={submitting}
                        onClick={() => submitInterest("homebuyerForm")}
                    >
                        {submitting ? "Submitting…" : "Join the Interest List"}
                    </button>
                    )}

                </div>

                <p className="form-error" role="alert">{formErrors.homebuyerForm}</p>

                <p className="privacy">
                    By submitting this form, you agree to receive PreQualy
                    updates. Your information will not be sold.
                </p>
                </form>
                )
            )}


            {/* =====================================================
                PROFESSIONAL FORM
            ===================================================== */}
            {activeForm === "professionalForm" && (
                submitted === "professionalForm" ? (
                <SuccessPanel />
                ) : (
                <form
                className="form-panel multi-step-form"
                id="professionalForm"
                data-form-name="Real Estate Professional"
                onSubmit={(e) => e.preventDefault()}
                >
                <div className="form-panel-header">
                    <div>
                    <p className="eyebrow">Real Estate Professional</p>

                    <h2 tabIndex="-1">
                        Join the future professional network
                    </h2>

                    <p>
                        Tell us about your role, market, and interest in future
                        collaboration.
                    </p>
                    </div>

                    <button
                    type="button"
                    className="close-form"
                    aria-label="Close form"
                    onClick={closeForm}
                    >
                    ×
                    </button>
                </div>

                <div className="progress" aria-hidden="true">
                    <span className={currentStep("professionalForm") === 0 ? "active" : ""}></span>
                    <span className={currentStep("professionalForm") === 1 ? "active" : ""}></span>
                    <span className={currentStep("professionalForm") === 2 ? "active" : ""}></span>
                </div>

                <div className="hp-field" aria-hidden="true">
                    <label>
                    Do not fill this field
                    <input
                        type="text"
                        name="company_website"
                        tabIndex="-1"
                        autoComplete="off"
                    />
                    </label>
                </div>


                <div className={"form-step" + (currentStep("professionalForm") === 0 ? " active" : "")}>
                    <div className="field-grid">

                        <label className="field">
                        <span className="lbl">Full Name</span>
                        <input
                            name="fullName"
                            required
                            autoComplete="name"
                        />
                        </label>

                        <label className="field">
                        <span className="lbl">Email Address</span>
                        <input
                            type="email"
                            name="email"
                            required
                            autoComplete="email"
                        />
                        </label>

                        <label className="field">
                        <span className="lbl">
                            Phone Number <span className="opt">(Optional)</span>
                        </span>

                        <input
                            type="tel"
                            name="phone"
                            autoComplete="tel"
                        />
                        </label>

                        <label className="field">
                        <span className="lbl">Profession</span>

                        <select name="profession" required>
                            <option value="">
                            Select your profession
                            </option>
                            <option>Real Estate Agent</option>
                            <option>Broker</option>
                            <option>Loan Officer</option>
                            <option>Mortgage Broker</option>
                            <option>Housing Counselor</option>
                            <option>Builder</option>
                            <option>Title or Escrow Professional</option>
                            <option>Other</option>
                        </select>
                        </label>

                        <label className="field">
                        <span className="lbl">State</span>

                        <select
                            name="state"
                            id="pro-state"
                            required
                        >
                            <option value="">
                            Select primary state
                            </option>

                            {states.map((state) => (
                            <option key={state} value={state}>
                                {state}
                            </option>
                            ))}
                        </select>
                        </label>

                        <label className="field">
                        <span className="lbl">County</span>

                        <input
                            name="county"
                            id="pro-county"
                            list="pro-county-list"
                            placeholder="Enter or select county"
                            required
                            autoComplete="off"
                        />

                        <datalist id="pro-county-list"></datalist>
                        </label>

                    </div>
                    </div>


                <div className={"form-step" + (currentStep("professionalForm") === 1 ? " active" : "")}>
                    <div className="field-grid">

                        <label className="field">
                        <span className="lbl">
                            Company or Brokerage
                        </span>
                        <input name="company" />
                        </label>

                        <label className="field">
                        <span className="lbl">Title or Role</span>
                        <input name="title" />
                        </label>

                        <label className="field full">
                        <span className="lbl">
                            Counties or Markets Served
                        </span>

                        <input
                            name="markets"
                            placeholder="Example: Los Angeles, Orange, Riverside"
                        />
                        </label>

                        <label className="field">
                        <span className="lbl">
                            Years of Experience
                        </span>

                        <input
                            type="number"
                            min="0"
                            name="experience"
                        />
                        </label>

                        <label className="field">
                        <span className="lbl">
                            Approximate Clients Served Annually
                        </span>

                        <input
                            type="number"
                            min="0"
                            name="annualClients"
                        />
                        </label>

                    </div>
                    </div>


                <div className={"form-step" + (currentStep("professionalForm") === 2 ? " active" : "")}>
                    <div className="field full">
                        <span className="lbl">
                        What are you interested in?
                        </span>

                        <div className="checkbox-grid">

                        <label className="check">
                            <input
                            type="checkbox"
                            name="interests"
                            value="Buyer Referrals"
                            />
                            Buyer referrals
                        </label>

                        <label className="check">
                            <input
                            type="checkbox"
                            name="interests"
                            value="Pilot Programs"
                            />
                            Pilot programs
                        </label>

                        <label className="check">
                            <input
                            type="checkbox"
                            name="interests"
                            value="Program Insights"
                            />
                            Housing program insights
                        </label>

                        <label className="check">
                            <input
                            type="checkbox"
                            name="interests"
                            value="Training"
                            />
                            Training and education
                        </label>

                        <label className="check">
                            <input
                            type="checkbox"
                            name="interests"
                            value="Platform Partnerships"
                            />
                            Platform partnerships
                        </label>

                        <label className="check">
                            <input
                            type="checkbox"
                            name="interests"
                            value="Integrations"
                            />
                            Technology integrations
                        </label>

                        </div>
                    </div>
                    </div>

                <div className="form-actions">

                    {currentStep("professionalForm") > 0 && (
                    <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => previousStep("professionalForm")}
                    >
                        Back
                    </button>
                    )}

                    {currentStep("professionalForm") < 2 ? (
                    <button
                        type="button"
                        className="button button-primary"
                        onClick={() => nextStep("professionalForm")}
                    >
                        Next
                    </button>
                    ) : (
                    <button
                        type="button"
                        className="button button-primary"
                        disabled={submitting}
                        onClick={() => submitInterest("professionalForm")}
                    >
                        {submitting ? "Submitting…" : "Join the Interest List"}
                    </button>
                    )}

                </div>

                <p className="form-error" role="alert">{formErrors.professionalForm}</p>

                <p className="privacy">
                    Joining the interest list does not create a referral,
                    brokerage, lending, or contractual relationship.
                </p>
                </form>
                )
            )}


            {/* =====================================================
                GOVERNMENT FORM
            ===================================================== */}
            {activeForm === "governmentForm" && (
                submitted === "governmentForm" ? (
                <SuccessPanel />
                ) : (
                <form
                className="form-panel multi-step-form"
                id="governmentForm"
                data-form-name="Government Agency"
                onSubmit={(e) => e.preventDefault()}
                >
                <div className="form-panel-header">
                    <div>
                    <p className="eyebrow">Government Agency</p>

                    <h2 tabIndex="-1">
                        Explore future coordination opportunities
                    </h2>

                    <p>
                        This is not a funding request or procurement agreement.
                    </p>
                    </div>

                    <button
                    type="button"
                    className="close-form"
                    aria-label="Close form"
                    onClick={closeForm}
                    >
                    ×
                    </button>
                </div>

                <div className="progress" aria-hidden="true">
                    <span className={currentStep("governmentForm") === 0 ? "active" : ""}></span>
                    <span className={currentStep("governmentForm") === 1 ? "active" : ""}></span>
                    <span className={currentStep("governmentForm") === 2 ? "active" : ""}></span>
                </div>

                <div className="hp-field" aria-hidden="true">
                    <label>
                    Do not fill this field
                    <input
                        type="text"
                        name="company_website"
                        tabIndex="-1"
                        autoComplete="off"
                    />
                    </label>
                </div>


                <div className={"form-step" + (currentStep("governmentForm") === 0 ? " active" : "")}>
                    <div className="field-grid">

                        <label className="field">
                        <span className="lbl">
                            Agency or Department Name
                        </span>
                        <input name="agencyName" required />
                        </label>

                        <label className="field">
                        <span className="lbl">
                            Primary Contact Name
                        </span>
                        <input
                            name="fullName"
                            required
                            autoComplete="name"
                        />
                        </label>

                        <label className="field">
                        <span className="lbl">
                            Email Address
                        </span>
                        <input
                            type="email"
                            name="email"
                            required
                            autoComplete="email"
                        />
                        </label>

                        <label className="field">
                        <span className="lbl">
                            Title or Role
                        </span>
                        <input name="title" required />
                        </label>

                        <label className="field">
                        <span className="lbl">State</span>

                        <select
                            name="state"
                            id="gov-state"
                            required
                        >
                            <option value="">
                            Select state
                            </option>

                            {states.map((state) => (
                            <option key={state} value={state}>
                                {state}
                            </option>
                            ))}
                        </select>
                        </label>

                        <label className="field">
                        <span className="lbl">County</span>

                        <input
                            name="county"
                            id="gov-county"
                            list="gov-county-list"
                            placeholder="Enter or select county"
                            required
                            autoComplete="off"
                        />

                        <datalist id="gov-county-list"></datalist>
                        </label>

                    </div>
                    </div>


                <div className={"form-step" + (currentStep("governmentForm") === 1 ? " active" : "")}>
                    <div className="field-grid">

                        <label className="field">
                        <span className="lbl">Agency Type</span>

                        <select name="agencyType">
                            <option>City Government</option>
                            <option>County Government</option>
                            <option>State Agency</option>
                            <option>Public Housing Authority</option>
                            <option>Community Development Department</option>
                            <option>Other</option>
                        </select>
                        </label>

                        <label className="field">
                        <span className="lbl">
                            Primary Service Area
                        </span>

                        <input
                            name="serviceArea"
                            placeholder="State, county, city, or region"
                        />
                        </label>

                        <label className="field full">
                        <span className="lbl">
                            Familiarity with Homeownership Programs
                        </span>

                        <select name="familiarity">
                            <option>
                            Administer programs directly
                            </option>
                            <option>
                            Oversee compliance or policy
                            </option>
                            <option>
                            Provide funding oversight
                            </option>
                            <option>
                            Limited involvement, interested in coordination
                            </option>
                            <option>
                            Exploring new initiatives
                            </option>
                        </select>
                        </label>

                    </div>
                    </div>


                <div className={"form-step" + (currentStep("governmentForm") === 2 ? " active" : "")}>

                    <label className="field full">
                        <span className="lbl">
                        Interest in Pilot Collaboration
                        </span>

                        <select name="pilotInterest">
                        <option>Yes</option>
                        <option>Possibly</option>
                        <option>Just joining for updates</option>
                        </select>
                    </label>

                    <label
                        className="field full"
                        style={{ marginTop: "18px" }}
                    >
                        <span className="lbl">
                        Additional Information
                        </span>

                        <textarea
                        name="notes"
                        placeholder="Tell us about current priorities, program challenges, or potential collaboration interests."
                        />
                    </label>

                    </div>

                <div className="form-actions">

                    {currentStep("governmentForm") > 0 && (
                    <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => previousStep("governmentForm")}
                    >
                        Back
                    </button>
                    )}

                    {currentStep("governmentForm") < 2 ? (
                    <button
                        type="button"
                        className="button button-primary"
                        onClick={() => nextStep("governmentForm")}
                    >
                        Next
                    </button>
                    ) : (
                    <button
                        type="button"
                        className="button button-primary"
                        disabled={submitting}
                        onClick={() => submitInterest("governmentForm")}
                    >
                        {submitting ? "Submitting…" : "Join the Interest List"}
                    </button>
                    )}

                </div>

                <p className="form-error" role="alert">{formErrors.governmentForm}</p>

                <p className="privacy">
                    PreQualy is designed to complement existing agency systems
                    and improve visibility, coordination, and utilization.
                </p>
                </form>
                )
            )}


            {/* =====================================================
                NONPROFIT FORM
            ===================================================== */}
            {activeForm === "nonprofitForm" && (
                submitted === "nonprofitForm" ? (
                <SuccessPanel />
                ) : (
                <form
                className="form-panel multi-step-form"
                id="nonprofitForm"
                data-form-name="Nonprofit Organization"
                onSubmit={(e) => e.preventDefault()}
                >
                <div className="form-panel-header">
                    <div>
                    <p className="eyebrow">
                        Nonprofit Organization
                    </p>

                    <h2 tabIndex="-1">
                        Help connect communities to opportunity
                    </h2>

                    <p>
                        Share your mission, service area, and partnership
                        interests.
                    </p>
                    </div>

                    <button
                    type="button"
                    className="close-form"
                    aria-label="Close form"
                    onClick={closeForm}
                    >
                    ×
                    </button>
                </div>

                <div className="progress" aria-hidden="true">
                    <span className={currentStep("nonprofitForm") === 0 ? "active" : ""}></span>
                    <span className={currentStep("nonprofitForm") === 1 ? "active" : ""}></span>
                    <span className={currentStep("nonprofitForm") === 2 ? "active" : ""}></span>
                </div>

                <div className="hp-field" aria-hidden="true">
                    <label>
                    Do not fill this field
                    <input
                        type="text"
                        name="company_website"
                        tabIndex="-1"
                        autoComplete="off"
                    />
                    </label>
                </div>


                <div className={"form-step" + (currentStep("nonprofitForm") === 0 ? " active" : "")}>
                    <div className="field-grid">

                        <label className="field">
                        <span className="lbl">
                            Organization Name
                        </span>

                        <input
                            name="organization"
                            required
                        />
                        </label>

                        <label className="field">
                        <span className="lbl">
                            Contact Name
                        </span>

                        <input
                            name="fullName"
                            required
                            autoComplete="name"
                        />
                        </label>

                        <label className="field">
                        <span className="lbl">
                            Email Address
                        </span>

                        <input
                            type="email"
                            name="email"
                            required
                            autoComplete="email"
                        />
                        </label>

                        <label className="field">
                        <span className="lbl">
                            Title or Role
                        </span>

                        <input name="title" />
                        </label>

                        <label className="field">
                        <span className="lbl">
                            State
                        </span>

                        <select
                            name="state"
                            id="np-state"
                            required
                        >
                            <option value="">
                            Select state
                            </option>

                            {states.map((state) => (
                            <option key={state} value={state}>
                                {state}
                            </option>
                            ))}
                        </select>
                        </label>

                        <label className="field">
                        <span className="lbl">
                            County
                        </span>

                        <input
                            name="county"
                            id="np-county"
                            list="np-county-list"
                            placeholder="Enter or select county"
                            required
                            autoComplete="off"
                        />

                        <datalist id="np-county-list"></datalist>
                        </label>

                    </div>
                    </div>


                <div className={"form-step" + (currentStep("nonprofitForm") === 1 ? " active" : "")}>
                    <div className="field-grid">

                        <label className="field">
                        <span className="lbl">
                            Mission Area
                        </span>

                        <select name="missionArea">
                            <option>Housing Counseling</option>
                            <option>Financial Education</option>
                            <option>Community Development</option>
                            <option>Legal Services</option>
                            <option>Workforce Development</option>
                            <option>Family Services</option>
                            <option>Other</option>
                        </select>
                        </label>

                        <label className="field">
                        <span className="lbl">
                            Counties or Communities Served
                        </span>

                        <input name="serviceArea" />
                        </label>

                        <label className="field full">
                        <span className="lbl">
                            Populations Served
                        </span>

                        <input
                            name="populations"
                            placeholder="Describe the communities or client groups you serve"
                        />
                        </label>

                    </div>
                    </div>


                <div className={"form-step" + (currentStep("nonprofitForm") === 2 ? " active" : "")}>
                    <div className="field full">
                        <span className="lbl">
                        What are you interested in?
                        </span>

                        <div className="checkbox-grid">

                        <label className="check">
                            <input
                            type="checkbox"
                            name="interests"
                            value="Client Referrals"
                            />
                            Client referrals
                        </label>

                        <label className="check">
                            <input
                            type="checkbox"
                            name="interests"
                            value="Resource Sharing"
                            />
                            Resource sharing
                        </label>

                        <label className="check">
                            <input
                            type="checkbox"
                            name="interests"
                            value="Pilot Programs"
                            />
                            Pilot programs
                        </label>

                        <label className="check">
                            <input
                            type="checkbox"
                            name="interests"
                            value="Data and Impact"
                            />
                            Data and impact tools
                        </label>

                        <label className="check">
                            <input
                            type="checkbox"
                            name="interests"
                            value="Community Partnerships"
                            />
                            Community partnerships
                        </label>

                        <label className="check">
                            <input
                            type="checkbox"
                            name="interests"
                            value="Training"
                            />
                            Training and education
                        </label>

                        </div>
                    </div>
                    </div>

                <div className="form-actions">

                    {currentStep("nonprofitForm") > 0 && (
                    <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => previousStep("nonprofitForm")}
                    >
                        Back
                    </button>
                    )}

                    {currentStep("nonprofitForm") < 2 ? (
                    <button
                        type="button"
                        className="button button-primary"
                        onClick={() => nextStep("nonprofitForm")}
                    >
                        Next
                    </button>
                    ) : (
                    <button
                        type="button"
                        className="button button-primary"
                        disabled={submitting}
                        onClick={() => submitInterest("nonprofitForm")}
                    >
                        {submitting ? "Submitting…" : "Join the Interest List"}
                    </button>
                    )}

                </div>

                <p className="form-error" role="alert">{formErrors.nonprofitForm}</p>

                <p className="privacy">
                    Your information will be used for platform updates,
                    research, and potential coordination discussions.
                </p>
                </form>
                )
            )}

            </div>
        </section>

        </main>
    </>
  );
}


/* =============================================================
   STATES
============================================================= */

const states = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "District of Columbia",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

export default Home;
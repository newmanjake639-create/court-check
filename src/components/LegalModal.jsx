const CONTENT = {
  privacy: {
    title: 'Privacy Policy',
    updated: 'February 2026',
    sections: [
      {
        heading: 'Information We Collect',
        body: 'Court Check collects player names (chosen by you) and voluntary check-in locations when you check in to a basketball court. We also collect the time and estimated duration of your session. No account creation or personal identification is required to use the app.',
      },
      {
        heading: 'How We Use Your Data',
        body: 'Your player name and check-in location are displayed to other Court Check users to show real-time court activity. This is the core feature of the app — letting the community know where runs are happening. We do not use your data for any other purpose.',
      },
      {
        heading: 'We Do Not Sell Your Data',
        body: 'Court Check does not sell, rent, or trade your personal information to any third parties. Your data is never used for advertising profiling, shared with marketing companies, or disclosed to outside organizations except as required by law.',
      },
      {
        heading: 'Data Retention & Removal',
        body: 'You can check out at any time to immediately remove your name and location from all active court listings. Check-ins older than 8 hours are automatically marked inactive. You remain in control of your data at all times.',
      },
      {
        heading: 'Data Storage & Security',
        body: 'All data is stored securely using Supabase, a trusted cloud database platform with industry-standard encryption, access controls, and security practices. We do not store passwords, payment information, or government identification.',
      },
      {
        heading: 'Third-Party Services',
        body: 'Court Check uses Google Maps to display court locations. Google may collect data in accordance with their own Privacy Policy. We also use Supabase for database services. We encourage you to review their respective privacy policies at maps.google.com and supabase.com.',
      },
      {
        heading: 'Contact Us',
        body: 'If you have questions or concerns about your privacy or would like to request data deletion, please contact us at privacy@courtcheck.app. We are committed to addressing any privacy-related issues promptly.',
      },
    ],
  },
  tos: {
    title: 'Terms of Service',
    updated: 'February 2026',
    sections: [
      {
        heading: 'Honest Check-Ins',
        body: 'By using Court Check, you agree to check in honestly and only when you are physically present at a basketball court. False or misleading check-ins misrepresent court activity to the community and are strictly prohibited.',
      },
      {
        heading: 'Community Conduct',
        body: 'You agree not to harass, intimidate, threaten, or engage in inappropriate behavior toward other users on or off the platform. Court Check is a community tool built on mutual respect. Treat other players the way you want to be treated on the court.',
      },
      {
        heading: 'Enforcement',
        body: 'We reserve the right to remove, suspend, or restrict access for any user who misuses the app, provides false check-ins, engages in abusive behavior, or otherwise violates these Terms of Service, at our sole discretion and without prior notice.',
      },
      {
        heading: 'No Warranties',
        body: 'Court Check is provided "as-is" without warranties of any kind, express or implied. We make no guarantees about the accuracy of court information, player counts, court availability, or app uptime. Use of the app is entirely at your own discretion and risk.',
      },
      {
        heading: 'Limitation of Liability',
        body: 'Court Check is an information platform only and is not responsible for anything that happens at physical court locations. By using this app you acknowledge that participation in basketball and other physical activities carries inherent risks, and Court Check bears no liability for injuries, disputes, or incidents at any location.',
      },
      {
        heading: 'Google Maps',
        body: 'Court Check uses Google Maps for location and mapping services. By using this app, you also agree to Google\'s Terms of Service as they apply to Maps functionality. You can review Google\'s terms at maps.google.com/help/terms_maps.',
      },
      {
        heading: 'Changes to Terms',
        body: 'We may update these Terms of Service from time to time. Continued use of the app after changes are posted constitutes your acceptance of the revised terms. We will make reasonable efforts to notify users of material changes.',
      },
      {
        heading: 'Contact',
        body: 'For questions about these Terms of Service, contact us at legal@courtcheck.app.',
      },
    ],
  },
};

const LegalModal = ({ page, onClose }) => {
  const content = CONTENT[page];
  if (!content) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>Court Check</div>
            <h2 style={styles.title}>{content.title}</h2>
            <p style={styles.updated}>Last updated {content.updated}</p>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.body}>
          {content.sections.map((s, i) => (
            <div key={i} style={styles.section}>
              <h3 style={styles.sectionHeading}>{s.heading}</h3>
              <p style={styles.sectionBody}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(6px)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  modal: {
    background: '#0d0d0d',
    border: '1px solid #2a2a2a',
    borderBottom: 'none',
    borderRadius: '20px 20px 0 0',
    width: '100%',
    maxWidth: '680px',
    maxHeight: '88vh',
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideInBottom 0.25s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '24px 24px 18px',
    borderBottom: '1px solid #1f1f1f',
    flexShrink: 0,
  },
  eyebrow: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#ff6b1a',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '5px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '900',
    color: '#f0f0f0',
    marginBottom: '4px',
    letterSpacing: '-0.3px',
  },
  updated: {
    fontSize: '12px',
    color: '#444',
  },
  closeBtn: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#666',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '13px',
    flexShrink: 0,
  },
  body: {
    overflowY: 'auto',
    padding: '20px 24px 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  section: {
    borderLeft: '2px solid rgba(255,107,26,0.25)',
    paddingLeft: '16px',
  },
  sectionHeading: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#ff6b1a',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  sectionBody: {
    fontSize: '14px',
    color: '#777',
    lineHeight: 1.75,
  },
};

export default LegalModal;

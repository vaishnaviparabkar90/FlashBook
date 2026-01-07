
export default function Footer() {
  return (
    <footer
      className="text-light py-4 mt-2"
      style={{ backgroundColor: '#333333' }}
    >
      <div className="container text-center">
        <p className="mb-1">&copy; 2025 <strong>BookingApp</strong>. All rights reserved.</p>

        <p className="small mb-1">
          Made with ❤️ by <strong>Vaishnavi Parabkar</strong>
        </p>

        <p className="small text-warning mb-2">
          This app is for development and demonstration purposes only. Not intended for real-world production use.
        </p>

        <div className="small">
          <a href="/privacy" className="text-light me-3 text-decoration-none">Privacy Policy</a>
          <a href="/terms" className="text-light text-decoration-none">Terms of Use</a>
        </div>
      </div>
    </footer>
  );
}

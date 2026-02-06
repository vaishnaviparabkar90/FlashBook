export default function Footer() {
  return (
    <footer className="bg-[#333333] text-gray-200 py-6 mt-4">
      <div className="max-w-6xl mx-auto px-4 text-center space-y-2">
        <p className="text-sm">
          © 2025 <span className="font-semibold">BookingApp</span>. All rights reserved.
        </p>

        <p className="text-sm">
          Made with <span className="text-red-400">❤️</span> by{' '}
          <span className="font-semibold">Vaishnavi Parabkar</span>
        </p>

        <p className="text-xs text-yellow-300 max-w-3xl mx-auto">
          This app is for development and demonstration purposes only. Not intended for real-world production use.
        </p>

        <div className="flex justify-center gap-4 text-xs pt-2">
          <a
            href="/"
            className="hover:text-white transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="/"
            className="hover:text-white transition-colors"
          >
            Terms of Use
          </a>
        </div>
      </div>
    </footer>
  );
}

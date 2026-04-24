const Loader = ({ className = "w-5 h-5" }: { className?: string }) => {
  return (
    <div className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} role="status" aria-label="loading">
      <span className="sr-only">Loading...</span>
    </div>
  );
};



export default Loader;

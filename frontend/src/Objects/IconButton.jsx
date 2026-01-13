export default IconButton = ({ onClick, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    className="icon-btn"
  >
    {children}
  </button>
);
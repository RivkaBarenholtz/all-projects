import { useState, useEffect, useRef } from "react";
import { fetchWithAuth, SafeParseJson, handleUnauthorized } from "./Utilities";
import "./Styles/header.css"

export default function Header({ title,openNav, setOpenNav }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState({});
  const [availableVendors, setAvailableVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState();
  const menuRef = useRef(null);

  const toggleMenu = () => setOpen(!open);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const userJsonString = localStorage.getItem("User");
    const userItem = userJsonString ? SafeParseJson(userJsonString) : null;
    if (userItem) {
      setUser(userItem);
    }
  }, []);

  useEffect(() => {
    async function getVendors() {
      const vendors = await fetchWithAuth("get-available-vendors", {});
      setAvailableVendors(vendors);
      if (!localStorage.getItem("currentVendor")) {
        setSelected(vendors[0].Id);
      } else {
        setSelectedVendor(localStorage.getItem("currentVendor"));
      }
    }
    getVendors();
  }, []);

  const setSelected = (vendorid) => {
    setSelectedVendor(vendorid);
    localStorage.setItem("currentVendor", vendorid);
    window.location.reload(false);
  };

  const currentVendor = availableVendors.find((x) => x.Id == selectedVendor);

  return (
    <header className="app-header">
      <div class="nav-left">
        {/* Hamburger button (only visible on mobile) */}
        <div className="hamburger" onClick={() => setOpenNav(!openNav)}>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div class="page-title">{title}</div>
      </div>
      <div className="user-account-container" ref={menuRef}>
        <div className="user-account-selector" onClick={toggleMenu}>
          <img
            src="https://www.gravatar.com/avatar/?d=mp"
            alt={user?.name || "User"}
            className="avatar"
          />
          <div className="user-info">
            <button
              className={`account-selector ${open ? "open" : ""}`}

            >
              <span className="account-name">
                {currentVendor?.CardknoxAccountCode || "Select Account"}
              </span>


            </button>
            <div className="user-name">{user?.name || "User"}</div>
          </div>
          <svg
            className="dropdown-icon"
            width="16"
            height="16"
            viewBox="0 0 16 16"
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
            />
          </svg>
        </div>

        {open && (
          <div className="account-dropdown">
            <div className="dropdown-header">Switch Account</div>

            <div className="dropdown-accounts">
              {availableVendors.map((vendor) => (
                <div
                  key={vendor.Id}
                  className={`account-item ${selectedVendor == vendor.Id ? "active" : ""
                    }`}
                  onClick={() => setSelected(vendor.Id)}
                >
                  <div className="account-item-info">
                    <div className="account-item-name">
                      {vendor.CardknoxAccountCode}
                    </div>

                  </div>
                  {selectedVendor == vendor.Id && (
                    <div className="account-item-check">✓</div>
                  )}
                </div>
              ))}
            </div>

            <div className="dropdown-divider"></div>

            <button className="dropdown-action logout-btn" onClick={handleUnauthorized}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                style={{ marginRight: "8px" }}
              >
                <path
                  d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6"
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Log Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
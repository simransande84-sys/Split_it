import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

export default function JoinGroup() {
  const [groupName, setGroupName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [showPrompt, setShowPrompt] = useState(true);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({}); 

  const apiUrl = import.meta.env.VITE_API_URL;
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  useEffect(() => {
    const fetchGroupDetails = async () => {
      const requestUrl = `${apiUrl}/details/${token}`;
      console.log("[JoinGroup] Extracted token from URL search query:", token);
      console.log("[JoinGroup] Requesting GET from API URL:", requestUrl);

      try {
        const response = await axios.get(requestUrl);
        console.log("[JoinGroup] GET /details response:", response.data);
        setGroupName(response.data.name);
        setCreatorName(response.data.createdBy);
      } catch (err) {
        console.error("[JoinGroup] Error fetching group details:", err);
        if (!err.response) {
          setMessage(`Network Error: Backend server unreachable at ${requestUrl}`);
        } else if (err.response.status === 404) {
          setMessage("Invalid or expired invite link. (Group or token not found in database)");
        } else if (err.response.status === 500) {
          setMessage(`Backend Server Error (500): ${err.response.data?.message || "Internal server error"}`);
        } else {
          setMessage(`Error (${err.response.status}): ${err.response.data?.message || "Failed to fetch details"}`);
        }
      }
    };

    if (token) {
      fetchGroupDetails();
    } else {
      console.warn("[JoinGroup] No token parameter present in URL.");
      setMessage("Missing invite token in URL.");
    }
  }, [token, apiUrl]);

  const validateEmail = (email) => {
    let message = "";
    if (!email.trim()) {
      message = "Email is required"; 
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      message = "Invalid email format"; 
    }
    setErrors((prevErrors) => ({ ...prevErrors, email: message })); 
    return message === ""; 
  };


  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);  
    validateEmail(newEmail); 
  };

  const handleJoin = async () => {
    if (!validateEmail(email)) return; 

    try {
      const response = await axios.get(
        `${apiUrl}/join-group?token=${token}&email=${email}&accept=yes`
      );
      setMessage(response.data.message || "You have successfully joined the group!");
    } catch (err) {
      console.error("Error joining group:", err);
      setMessage("Failed to join group.");
    }
  };

  if (message) {
    return <div className="text-center mt-10 text-lg">{message}</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      {showPrompt && (
        <>
          <h2 className="text-xl font-semibold mb-4">
            Do you want to join the group &quot;{groupName}&quot; made by {creatorName}?
          </h2>
          <div className="flex justify-between">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={() => {
                setShowPrompt(false);
                setShowEmailInput(true);
              }}
            >
              Yes
            </button>
            <button
              className="bg-red-500 px-4 py-2 rounded text-white"
              onClick={() => setMessage("You declined the invite.")}
            >
              No
            </button>
          </div>
        </>
      )}

      {showEmailInput && (
        <div className="mt-6">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={handleEmailChange} 
            className="w-full p-2 border border-gray-300 rounded"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mb-2">{errors.email}</p> 
          )}
          <button
            className="w-full bg-blue-600 text-white p-2 rounded my-3"
            onClick={handleJoin}
          >
            Join Group
          </button>
        </div>
      )}
    </div>
  );
}

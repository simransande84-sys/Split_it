import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faUsers,
  faTimes,
  faLink,
} from "@fortawesome/free-solid-svg-icons";
import splitMoney from "../assets/split_money.png";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CurrencyInput from "react-currency-input-field";
import currencySymbols from "../data/currencySymbols";

export default function CreateSplit() {
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [emails, setEmails] = useState([""]);
  const [emailErrors, setEmailErrors] = useState([""]);
  const [groups, setGroups] = useState([]);
  const [groupNameError, setGroupNameError] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [splitOption, setSplitOption] = useState("equally");
  const [groupName, setGroupName] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const apiUrl = import.meta.env.VITE_API_URL;
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [individualAmounts, setIndividualAmounts] = useState({});
  const selectedGroupObj = groups.find((g) => g._id === selectedGroup);
  const groupMemberEmails = selectedGroupObj
    ? selectedGroupObj.members.map((m) => m.email)
    : [];
  const [currency, setCurrency] = useState("INR");

  const resetSplitForm = () => {
    setTitle("");
    setDueDate("");
    setAmount("");
    setSplitOption("equally");
    setDescription("");
    setIndividualAmounts({});
    setSelectedGroup("");
    setCurrency("INR");
    setTitleError("");
  };

  const addEmailField = () => {
    setEmails([...emails, ""]);
    setEmailErrors([...emailErrors, ""]);
  };

  const handleEmailChange = (index, value) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);

    const newErrors = [...emailErrors];
    newErrors[index] =
      isValidEmail(value) || value === "" ? "" : "Invalid email format";
    setEmailErrors(newErrors);
  };

  const handleAddGroupClick = () => {
    setShowGroupModal(true);
    setInviteLink(null);
  };

  const handleSendInvite = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      toast.error("User is not logged in or userId not found", {
        autoClose: 2000,
      });
      return;
    }

    const trimmedName = groupName.trim();
    if (!trimmedName) {
      setGroupNameError("Please specify a group name.");
      return;
    } else {
      setGroupNameError("");
    }

    try {
      console.log("[CreateSplit] Sending POST request to:", `${apiUrl}/create-group`);
      console.log("[CreateSplit] Request payload:", { name: trimmedName, createdBy: userId });

      const res = await axios.post(`${apiUrl}/create-group`, {
        name: trimmedName,
        createdBy: userId,
      });

      console.log("[CreateSplit] Server response data:", res.data);

      if (res.data.inviteLink && res.data.inviteToken) {
        setInviteLink(res.data.inviteLink);
        setInviteToken(res.data.inviteToken);
        fetchGroups();
      } else {
        toast.error("Failed to generate invite link", { autoClose: 2000 });
      }
    } catch (err) {
      console.error("Error generating invite link:", err);
      toast.error("Could not generate invite link", { autoClose: 2000 });
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = () => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      axios
        .get(`${apiUrl}/get-groups`, {
          params: { createdBy: userId },
        })
        .then((res) => {
          if (res.data.success) {
            setGroups(res.data.groups);
          } else {
            toast.error("Failed to load groups", { autoClose: 2000 });
          }
        })
        .catch((err) => {
          console.error("Error fetching groups:", err);
          toast.error("Something went wrong while fetching groups", {
            autoClose: 2000,
          });
        });
    } else {
      toast.error("No user logged in", { autoClose: 2000 });
    }
  };

  const handleGroupSave = async () => {
    const trimmedName = groupName.trim();

    if (trimmedName.length === 0) {
      setGroupNameError("Please specify a group name.");
      return;
    } else {
      setGroupNameError("");
    }

    const validEmails = emails.filter((email) => email.trim() !== "");
    const hasInvalidEmails = validEmails.some((email) => !isValidEmail(email));

    if (hasInvalidEmails) {
      toast.info("Please fix invalid email(s) before submitting.", {
        autoClose: 2000,
      });
      return;
    }

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        toast.error("User ID not found. Please login again.", {
          autoClose: 2000,
        });
        return;
      }

      const res = await axios.post(`${apiUrl}/create`, {
        name: trimmedName,
        memberEmails: validEmails,
        createdBy: userId,
        inviteToken,
      });

      toast.success("Group created successfully!", {
        autoClose: 2000,
      });

      setShowGroupModal(false);
      fetchGroups();
      setGroupName("");
      setInviteLink("");
      setInviteToken("");
      setEmails([""]);
      setEmailErrors([""]);
    } catch (err) {
      console.error("Error creating group:", err);
      toast.error("Failed to create group", { autoClose: 2000 });
    }
  };

  const handleGroupChange = (e) => {
    setSelectedGroup(e.target.value);
  };

  const handleSplitSave = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      toast.error("User is not logged in or userId not found", {
        autoClose: 2000,
      });
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title for the split", {
        autoClose: 2000,
      });
      return;
    }

    if (!selectedGroup) {
      toast.error("Please select a group for the split", {
        autoClose: 2000,
      });
      return;
    }

    if (!groupMemberEmails || groupMemberEmails.length === 0) {
      toast.error("The selected group has no member emails. Please add members to the group first.", {
        autoClose: 2000,
      });
      return;
    }



    if (splitOption === "equally" && (!amount || amount <= 0)) {
      toast.error("Please enter a valid amount for the split", {
        autoClose: 2000,
      });
      return;
    }

    let splitDetails = {};
    let totalAmount = 0;

    if (splitOption === "equally") {
      const perPersonAmount = (
        parseFloat(amount) / groupMemberEmails.length
      ).toFixed(2);
      groupMemberEmails.forEach((email) => {
        splitDetails[email] = parseFloat(perPersonAmount);
      });
      totalAmount = parseFloat(amount);
    } else {
      splitDetails = { ...individualAmounts };
      totalAmount = Object.values(individualAmounts).reduce(
        (sum, val) => sum + parseFloat(val || 0),
        0
      );

      if (Object.keys(individualAmounts).length === 0 || totalAmount <= 0) {
        toast.error(
          "Please assign amounts to at least one person for individual split.",
          {
            autoClose: 2000,
          }
        );
        return;
      }
    }

    const payload = {
      title,
      group: selectedGroup || "",
      contacts: [],
      dueDate,
      currency,
      amount: totalAmount,
      description,
      createdBy: userId,
      splitOption,
      splitDetails,
    };

    try {
      const response = await axios.post(`${apiUrl}/splits`, payload);
      console.log("Split saved:", response.data);
      toast.success("Your split has been created successfully!", {
        autoClose: 2000,
      });
      setShowSplitModal(false);
    } catch (error) {
      console.error("Error saving split:", error);
      toast.error("There was an error saving the split. Please try again.", {
        autoClose: 2000,
      });
    }
  };

  return (
    <div className="flex flex-col justify-center items-center px-4 mt-5 md:mt-8 space-y-6 z-1000">
      <div className="bg-white p-6 rounded-lg shadow-[0px_4px_15px_rgba(0,0,0,0.2),0px_-4px_15px_rgba(0,0,0,0.1)] drop-shadow-lg w-full max-w-4xl flex flex-col md:flex-row items-center">
        <div className="flex-1 flex flex-col items-center text-center">
          <h2 className="text-lg font-semibold mb-4 text-[#1D214B]">
            Create a Split
          </h2>
          <button
            className="flex items-center justify-center w-3/4 p-3 bg-[#1F3C9A] text-white rounded-md hover:bg-[#1D214B] transition hover:cursor-pointer"
            onClick={() => {
              resetSplitForm();
              fetchGroups();
              setShowSplitModal(true);
            }}
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Add a Split
          </button>
        </div>
        <div className="flex-1 flex justify-center">
          <img
            src={splitMoney}
            alt="Split Money"
            className="max-w-full rounded-md"
          />
        </div>
      </div>

      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-white p-6 rounded-lg shadow-[0px_4px_15px_rgba(0,0,0,0.2),0px_-4px_15px_rgba(0,0,0,0.1)] drop-shadow-lg flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-4 text-[#1D214B]">
            Create a Group
          </h2>
          <button
            className="flex items-center justify-center w-3/4 p-3 bg-[#1F3C9A] text-white rounded-md hover:bg-[#1D214B] transition hover:cursor-pointer"
            onClick={handleAddGroupClick}
          >
            <FontAwesomeIcon icon={faUsers} className="mr-2" />
            Add a Group
          </button>
        </div>
      </div>

      {showGroupModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-[0px_4px_15px_rgba(0,0,0,0.2),0px_-4px_15px_rgba(0,0,0,0.1)] drop-shadow-lg w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 hover:cursor-pointer"
              onClick={() => setShowGroupModal(false)}
            >
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
            <h2 className="text-lg font-semibold mb-4 text-[#1D214B]">
              Create Group
            </h2>
            <input
              type="text"
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            {groupNameError && (
              <p style={{ color: "red", fontSize: "0.9rem" }}>
                {groupNameError}
              </p>
            )}
            <div className="mb-4 mt-4">
              <button
                className="w-full p-2 bg-[#1F3C9A] text-white rounded-md hover:cursor-pointer flex items-center justify-center"
                onClick={handleSendInvite}
              >
                Send Invite Link{" "}
                <FontAwesomeIcon icon={faLink} className="ml-2" />
              </button>

              {inviteLink && (
                <div className="mt-3 bg-gray-100 p-2 rounded-md flex items-center justify-between">
                  <span className="text-sm break-all">{inviteLink}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLink);
                      toast.info("Link copied!", { autoClose: 1000 });
                    }}
                    className="ml-2 text-blue-600 text-sm hover:underline cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              )}
            </div>

            <div className="mb-4">
              {emails.map((email, index) => (
                <div key={index} className="mb-2">
                  <input
                    type="email"
                    placeholder="Enter member email"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    className={`w-full p-2 border rounded-md ${
                      emailErrors[index] ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {emailErrors[index] && (
                    <p className="text-red-500 text-sm mt-1">
                      {emailErrors[index]}
                    </p>
                  )}
                </div>
              ))}
              <button
                className="text-[#1F3C9A] font-semibold hover:cursor-pointer"
                onClick={addEmailField}
              >
                + Add Member Email
              </button>
            </div>
            <div className="flex justify-end">
              <button
                className="px-6 py-2 ring-2 text-[#198754] ring-[#198754] hover:bg-[#198754] hover:text-white rounded-md hover:cursor-pointer"
                onClick={handleGroupSave}
              >
                Save Group
              </button>
            </div>
          </div>
        </div>
      )}

      {showSplitModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-[0px_4px_15px_rgba(0,0,0,0.2),0px_-4px_15px_rgba(0,0,0,0.1)] drop-shadow-lg w-full max-w-3xl relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 hover:cursor-pointer"
              onClick={() => setShowSplitModal(false)}
            >
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
            <h2 className="text-lg font-semibold mb-4 text-[#1D214B]">
              Add a Split
            </h2>

            <div className="mb-4 flex items-center space-x-4">
              <label
                htmlFor="split-title"
                className="font-semibold min-w-[15px]"
              >
                Title:
              </label>
              <input
                type="text"
                id="split-title"
                placeholder="Add Title for Split"
                className="flex-1 p-2 border border-gray-300 rounded-md"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              {titleError && (
                <span className="text-red-500 text-sm">{titleError}</span>
              )}
            </div>

            <div className="flex space-x-4 mb-4">
              <select
                className="w-1/2 p-2 border border-gray-300 rounded-md"
                value={selectedGroup}
                onChange={handleGroupChange}
              >
                <option value="">Select Group</option>
                {groups.map((group, index) => (
                  <option key={index} value={group._id}>
                    {group.name}
                  </option>
                ))}
              </select>

              <div className="w-1/2 flex flex-col">
                <label className="text-xs font-semibold text-[#1D214B] mb-1">
                  Payment Deadline (Optional)
                </label>
                <input
                  type="date"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex space-x-4 mb-4 mt-4">
              <div className="flex gap-4 w-full">
                <div className="flex items-center px-3 py-2 bg-gray-100 border border-gray-300 rounded-md font-bold text-gray-700 text-sm h-[41.5px] select-none">
                  ₹ INR
                </div>
                <select
                  className="w-1/2 p-2 border border-gray-300 rounded-md"
                  value={splitOption}
                  onChange={(e) => {
                    const newSplitOption = e.target.value;
                    setSplitOption(newSplitOption);
                    if (newSplitOption === "individual") {
                      setAmount("");
                    }
                    if (newSplitOption === "equally") {
                      setIndividualAmounts({});
                    }
                  }}
                >
                  <option value="equally">Divide Equally</option>
                  <option value="individual">Assign Individual Amount</option>
                </select>

                <CurrencyInput
                  decimalsLimit={2}
                  value={amount}
                  onValueChange={(value) => setAmount(value)}
                  className={`border pl-2 py-2 px-2 rounded w-50 text-base ${
                    splitOption === "individual"
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "border-gray-300"
                  }`}
                  placeholder="Enter Amount"
                  disabled={splitOption === "individual"}
                />
              </div>
            </div>

            {splitOption === "equally" && groupMemberEmails.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold mb-2 text-[#1D214B]">
                  Split Summary (Equally):
                </p>
                <ul className="list-disc ml-6 text-gray-700">
                  {groupMemberEmails.map((email, index) => (
                    <li key={index} className="text-md flex items-center my-2">
                      {email}:
                      <span className="flex items-center mx-2">
                        {currencySymbols[currency]}
                        <span>
                          {(amount / groupMemberEmails.length).toFixed(2)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {splitOption === "individual" && groupMemberEmails.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold mb-2 text-[#1D214B]">
                  Assign Individual Amounts:
                </p>
                <div className="space-y-2">
                  {groupMemberEmails.map((email, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="w-1/3 text-gray-700">{email}</span>
                      <input
                        type="number"
                        className="flex-1 p-2 border border-gray-300 rounded-md my-2"
                        placeholder="Enter amount"
                        value={individualAmounts[email] || ""}
                        onChange={(e) =>
                          setIndividualAmounts((prev) => ({
                            ...prev,
                            [email]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <textarea
                placeholder="Add Description"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <button
                className="px-6 py-2 ring-2 text-[#198754] ring-[#198754] hover:bg-[#198754] hover:text-white rounded-md hover:cursor-pointer"
                onClick={handleSplitSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}

// src/components/AdminDashboard.js
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";

function AdminDashboard({ filterProfileType = "all" }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const routeCollections = [
      "route-1","route-2","route-3","route-4","route-5","route-6",
      "route-7","route-8","route-9","route-10","route-11","route-12"
    ];

    const unsubscribes = [];

    routeCollections.forEach((routeCol) => {
      const conditions = [where("status", "==", "pending")];
      if (filterProfileType && filterProfileType !== "all") {
        conditions.push(where("profileType", "==", filterProfileType));
      }
      const q = query(collection(db, routeCol), ...conditions);

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const requests = [];
          querySnapshot.forEach((docSnap) => {
            requests.push({ id: docSnap.id, routeCol, ...docSnap.data() });
          });

          setPendingRequests((prev) => {
            const filteredPrev = prev.filter((r) => r.routeCol !== routeCol);
            return [...filteredPrev, ...requests];
          });
          setLoading(false);
        },
        (err) => {
          console.error("Error fetching requests:", err);
          setError("Failed to load requests: " + err.message);
          setLoading(false);
        }
      );

      unsubscribes.push(unsubscribe);
    });

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [filterProfileType]);

  const handleApprove = async (requestId, routeCollection) => {
    try {
      const requestRef = doc(db, routeCollection, requestId);
      await updateDoc(requestRef, {
        status: "approved",
        adminId: auth.currentUser.uid,
        approvedAt: new Date(),
      });
      alert("✅ Request approved!");
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      console.error(err);
      setError("Failed to approve: " + err.message);
    }
  };

  const handleReject = async (requestId, routeCollection) => {
    const reason = prompt("Enter reason for rejection (optional):");
    try {
      const requestRef = doc(db, routeCollection, requestId);
      await updateDoc(requestRef, {
        status: "rejected",
        adminId: auth.currentUser.uid,
        approvedAt: new Date(),
        rejectionReason: reason || "No reason provided",
      });
      alert("❌ Request rejected!");
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      console.error(err);
      setError("Failed to reject: " + err.message);
    }
  };

  if (loading) return <p>Loading requests...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const label =
    filterProfileType === "student"
      ? "Students"
      : filterProfileType === "teacher"
      ? "Teachers"
      : "All Profiles";

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "6px", textAlign: "center" }}>📋 Pending Bus Pass Requests</h2>
      <p style={{ marginTop: 0, textAlign: "center", color: "#6b7280" }}>Filter: {label}</p>
      {pendingRequests.length === 0 ? (
        <p>No pending requests 🎉</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "#fff",
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <thead style={{ background: "#f3f3f3" }}>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>USN</th>
                <th style={thStyle}>Route</th>
                <th style={thStyle}>Pickup Point</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRequests.map((req) => (
                <tr key={req.id}>
                  <td style={tdStyle}>{req.studentName}</td>
                  <td style={tdStyle}>{req.usn}</td>
                  <td style={tdStyle}>{req.routeName}</td>
                  <td style={tdStyle}>{req.pickupPoint}</td>
                  <td style={{ ...tdStyle, color: "orange", fontWeight: "bold" }}>
                    {req.status}
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleApprove(req.id, req.routeCol)} 
                      style={approveBtn}
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleReject(req.id, req.routeCol)}  
                      style={rejectBtn}
                    >
                      ❌ Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Reusable styles
const thStyle = {
  padding: "10px",
  border: "1px solid #ddd",
  textAlign: "left",
};

const tdStyle = {
  padding: "10px",
  border: "1px solid #ddd",
};

const approveBtn = {
  padding: "6px 12px",
  background: "green",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  marginRight: "8px",
};

const rejectBtn = {
  padding: "6px 12px",
  background: "red",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

export default AdminDashboard;

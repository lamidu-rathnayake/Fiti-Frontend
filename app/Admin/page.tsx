"use client";

import { useState, useEffect } from "react";
import {
  getAllProfiles,
  getAllShops,
  getAllRequests,
  createClient,
  createSeller,
  createShop,
  createClothingRequest,
  submitBid,
  Profile,
  Shop,
  ClothingRequest
} from "../../lib/api";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"users" | "shops" | "requests" | "bids">("users");

  // Data States
  const [users, setUsers] = useState<Profile[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [requests, setRequests] = useState<ClothingRequest[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"createClient" | "createSeller" | "createShop" | "createRequest" | "createBid" | null>(null);

  // Form States
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    // Load mock data
    getAllProfiles().then(setUsers);
    getAllShops().then(setShops);
    getAllRequests().then(setRequests);
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalType === "createClient") {
        await createClient({ id: formData.id, name: formData.name });
      } else if (modalType === "createSeller") {
        await createSeller({ id: formData.id, nic_front: formData.nicFront, nic_rear: formData.nicRear });
      } else if (modalType === "createShop") {
        await createShop({
          seller_id: formData.seller_id,
          shop_name: formData.shop_name,
          shop_address: formData.shop_address,
          city: formData.city
        });
      } else if (modalType === "createRequest") {
        await createClothingRequest({
          client_id: formData.client_id,
          clothing_category: formData.clothing_category,
          target_budget: Number(formData.target_budget),
          target_date: new Date().toISOString()
        });
      } else if (modalType === "createBid") {
        await submitBid({
          shop_request_id: Number(formData.shop_request_id),
          bid_amount: Number(formData.bid_amount),
        });
      }
      alert("Operation successful!");
      setIsModalOpen(false);
      setFormData({});
    } catch (err: any) {
      alert("Failed: " + err.message);
    }
  };

  const openModal = (type: any) => {
    setModalType(type);
    setFormData({});
    setIsModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-[#E2E2E2] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#121414] border-r border-[#4D4635]/30 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center border border-[#D4AF37]">
            <span className="text-black font-bold text-xs">FITI</span>
          </div>
          <span className="font-mono text-sm font-bold text-[#F2CA50] uppercase tracking-wider">
            Admin Portal
          </span>
        </div>

        <nav className="flex flex-col gap-2">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-3 rounded-xl text-left text-sm font-medium transition-all ${activeTab === "users" ? "bg-[#D4AF37]/10 text-[#F2CA50] border border-[#D4AF37]/30" : "text-[#D0C5AF] hover:bg-[#1A1C1C]"}`}
          >
            👥 Users Management
          </button>
          <button
            onClick={() => setActiveTab("shops")}
            className={`px-4 py-3 rounded-xl text-left text-sm font-medium transition-all ${activeTab === "shops" ? "bg-[#D4AF37]/10 text-[#F2CA50] border border-[#D4AF37]/30" : "text-[#D0C5AF] hover:bg-[#1A1C1C]"}`}
          >
            🏪 Shops & Ateliers
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-3 rounded-xl text-left text-sm font-medium transition-all ${activeTab === "requests" ? "bg-[#D4AF37]/10 text-[#F2CA50] border border-[#D4AF37]/30" : "text-[#D0C5AF] hover:bg-[#1A1C1C]"}`}
          >
            🧥 Clothing Requests
          </button>
          <button
            onClick={() => setActiveTab("bids")}
            className={`px-4 py-3 rounded-xl text-left text-sm font-medium transition-all ${activeTab === "bids" ? "bg-[#D4AF37]/10 text-[#F2CA50] border border-[#D4AF37]/30" : "text-[#D0C5AF] hover:bg-[#1A1C1C]"}`}
          >
            ⚖️ Bids & Orders
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#D4AF37]/5 via-[#0a0a0a] to-[#0a0a0a]">

        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white capitalize">{activeTab} Dashboard</h1>
            <p className="text-sm text-[#D0C5AF] mt-1">Manage all system {activeTab} across the FITI platform.</p>
          </div>
          <div className="flex gap-3">
            {activeTab === "users" && (
              <>
                <button onClick={() => openModal("createClient")} className="px-4 py-2 bg-[#1A1C1C] border border-[#4D4635] rounded-lg text-xs font-mono text-[#D0C5AF] hover:text-[#F2CA50] hover:border-[#F2CA50] transition-all">+ New Client</button>
                <button onClick={() => openModal("createSeller")} className="px-4 py-2 bg-[#F2CA50] text-[#121414] rounded-lg text-xs font-bold shadow-lg hover:shadow-[#F2CA50]/20 transition-all">+ New Seller</button>
              </>
            )}
            {activeTab === "shops" && (
              <button onClick={() => openModal("createShop")} className="px-4 py-2 bg-[#F2CA50] text-[#121414] rounded-lg text-xs font-bold shadow-lg hover:shadow-[#F2CA50]/20 transition-all">+ New Shop</button>
            )}
            {activeTab === "requests" && (
              <button onClick={() => openModal("createRequest")} className="px-4 py-2 bg-[#F2CA50] text-[#121414] rounded-lg text-xs font-bold shadow-lg hover:shadow-[#F2CA50]/20 transition-all">+ Create Request</button>
            )}
            {activeTab === "bids" && (
              <button onClick={() => openModal("createBid")} className="px-4 py-2 bg-[#F2CA50] text-[#121414] rounded-lg text-xs font-bold shadow-lg hover:shadow-[#F2CA50]/20 transition-all">+ Submit Proxy Bid</button>
            )}
          </div>
        </header>

        {/* Data Tables */}
        <div className="bg-[#121414] border border-[#4D4635]/30 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
          {activeTab === "users" && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#4D4635]/30">
                  <th className="pb-3 text-xs font-mono text-[#F2CA50] uppercase tracking-wider">User ID</th>
                  <th className="pb-3 text-xs font-mono text-[#F2CA50] uppercase tracking-wider">Type</th>
                  <th className="pb-3 text-xs font-mono text-[#F2CA50] uppercase tracking-wider">Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[#4D4635]/10 hover:bg-[#1A1C1C]/50 transition-colors">
                    <td className="py-4 text-sm font-medium text-white">{u.id}</td>
                    <td className="py-4 text-xs font-mono">
                      <span className={`px-2 py-1 rounded-md ${u.type === "client" ? "bg-blue-500/10 text-blue-400" : "bg-purple-500/10 text-purple-400"}`}>
                        {u.type}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-[#D0C5AF]">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === "shops" && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#4D4635]/30">
                  <th className="pb-3 text-xs font-mono text-[#F2CA50] uppercase tracking-wider">Shop Name</th>
                  <th className="pb-3 text-xs font-mono text-[#F2CA50] uppercase tracking-wider">Seller ID</th>
                  <th className="pb-3 text-xs font-mono text-[#F2CA50] uppercase tracking-wider">City</th>
                  <th className="pb-3 text-xs font-mono text-[#F2CA50] uppercase tracking-wider">Rating</th>
                </tr>
              </thead>
              <tbody>
                {shops.map((s) => (
                  <tr key={s.shop_id} className="border-b border-[#4D4635]/10 hover:bg-[#1A1C1C]/50 transition-colors">
                    <td className="py-4 text-sm font-medium text-white">{s.shop_name}</td>
                    <td className="py-4 text-sm text-[#D0C5AF]">{s.seller_id}</td>
                    <td className="py-4 text-sm text-[#D0C5AF]">{s.city}</td>
                    <td className="py-4 text-sm text-[#F2CA50]">★ {s.average_rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === "requests" && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#4D4635]/30">
                  <th className="pb-3 text-xs font-mono text-[#F2CA50] uppercase tracking-wider">Request ID</th>
                  <th className="pb-3 text-xs font-mono text-[#F2CA50] uppercase tracking-wider">Client ID</th>
                  <th className="pb-3 text-xs font-mono text-[#F2CA50] uppercase tracking-wider">Category</th>
                  <th className="pb-3 text-xs font-mono text-[#F2CA50] uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.request_id} className="border-b border-[#4D4635]/10 hover:bg-[#1A1C1C]/50 transition-colors">
                    <td className="py-4 text-sm font-medium text-white">REQ-{r.request_id}</td>
                    <td className="py-4 text-sm text-[#D0C5AF]">{r.client_id}</td>
                    <td className="py-4 text-sm text-[#D0C5AF]">{r.clothing_category}</td>
                    <td className="py-4 text-xs font-mono">
                      <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-400">{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === "bids" && (
            <div className="text-center py-10">
              <span className="text-4xl block mb-4">⚖️</span>
              <h3 className="text-lg font-bold text-white">No active bids</h3>
              <p className="text-sm text-[#D0C5AF]">Bids will appear here once submitted by Master Tailors.</p>
            </div>
          )}
        </div>
      </main>

      {/* CRUD Action Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121414] border border-[#4D4635]/50 p-8 rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(212,175,55,0.1)]">
            <h2 className="text-xl font-bold text-white mb-6 capitalize flex justify-between items-center">
              <span>{modalType?.replace(/([A-Z])/g, ' $1').trim()}</span>
              <button onClick={() => setIsModalOpen(false)} className="text-[#D0C5AF] hover:text-white">✕</button>
            </h2>

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
              {/* Dynamic Inputs based on Modal Type */}

              {/* Client Form */}
              {modalType === "createClient" && (
                <>
                  <input required placeholder="Firebase User ID (e.g. abc123uid)" value={formData.id || ""} onChange={(e) => setFormData({ ...formData, id: e.target.value })} className="bg-[#1A1C1C] border border-[#4D4635] text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#F2CA50]" />
                  <input placeholder="Full Name" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-[#1A1C1C] border border-[#4D4635] text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#F2CA50]" />
                </>
              )}

              {/* Seller Form */}
              {modalType === "createSeller" && (
                <>
                  <input required placeholder="Firebase User ID (e.g. xyz789uid)" value={formData.id || ""} onChange={(e) => setFormData({ ...formData, id: e.target.value })} className="bg-[#1A1C1C] border border-[#4D4635] text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#F2CA50]" />
                  <input required placeholder="NIC Front Image URL" value={formData.nicFront || ""} onChange={(e) => setFormData({ ...formData, nicFront: e.target.value })} className="bg-[#1A1C1C] border border-[#4D4635] text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#F2CA50]" />
                  <input required placeholder="NIC Rear Image URL" value={formData.nicRear || ""} onChange={(e) => setFormData({ ...formData, nicRear: e.target.value })} className="bg-[#1A1C1C] border border-[#4D4635] text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#F2CA50]" />
                </>
              )}

              {/* Shop Form */}
              {modalType === "createShop" && (
                <>
                  <input required placeholder="Seller ID" value={formData.seller_id || ""} onChange={(e) => setFormData({ ...formData, seller_id: e.target.value })} className="bg-[#1A1C1C] border border-[#4D4635] text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#F2CA50]" />
                  <input required placeholder="Atelier / Shop Name" value={formData.shop_name || ""} onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })} className="bg-[#1A1C1C] border border-[#4D4635] text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#F2CA50]" />
                  <input required placeholder="Shop Address" value={formData.shop_address || ""} onChange={(e) => setFormData({ ...formData, shop_address: e.target.value })} className="bg-[#1A1C1C] border border-[#4D4635] text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#F2CA50]" />
                  <input required placeholder="City" value={formData.city || ""} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="bg-[#1A1C1C] border border-[#4D4635] text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#F2CA50]" />
                </>
              )}

              {/* Request Form */}
              {modalType === "createRequest" && (
                <>
                  <input required placeholder="Client ID" value={formData.client_id || ""} onChange={(e) => setFormData({ ...formData, client_id: e.target.value })} className="bg-[#1A1C1C] border border-[#4D4635] text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#F2CA50]" />
                  <select required value={formData.clothing_category || ""} onChange={(e) => setFormData({ ...formData, clothing_category: e.target.value })} className="bg-[#1A1C1C] border border-[#4D4635] text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#F2CA50]">
                    <option value="" disabled>Select Category</option>
                    <option value="SUIT">Suit</option>
                    <option value="DRESS">Dress</option>
                    <option value="SHIRT">Shirt</option>
                  </select>
                  <input required type="number" placeholder="Target Budget ($)" value={formData.target_budget || ""} onChange={(e) => setFormData({ ...formData, target_budget: e.target.value })} className="bg-[#1A1C1C] border border-[#4D4635] text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#F2CA50]" />
                </>
              )}

              {/* Bid Form */}
              {modalType === "createBid" && (
                <>
                  <input required type="number" placeholder="Shop Request ID" value={formData.shop_request_id || ""} onChange={(e) => setFormData({ ...formData, shop_request_id: e.target.value })} className="bg-[#1A1C1C] border border-[#4D4635] text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#F2CA50]" />
                  <input required type="number" placeholder="Bid Amount ($)" value={formData.bid_amount || ""} onChange={(e) => setFormData({ ...formData, bid_amount: e.target.value })} className="bg-[#1A1C1C] border border-[#4D4635] text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#F2CA50]" />
                </>
              )}

              <button type="submit" className="w-full bg-[#F2CA50] hover:bg-[#D4AF37] text-black font-bold py-3 rounded-xl shadow-lg mt-4 transition-colors">
                Submit Record
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

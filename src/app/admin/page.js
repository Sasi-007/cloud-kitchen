import { redirect } from 'next/navigation';
export default function AdminIndex() { redirect('/admin/orders'); }

// export default function AdminPage() {
//   const { orders, updateOrderStatus, showToast } = useApp();

//   const newOrders       = orders.filter((o) => o.status === 'new');
//   const progressOrders  = orders.filter((o) => o.status === 'progress');
//   const deliveredOrders = orders.filter((o) => o.status === 'delivered');
//   const revenue         = deliveredOrders.reduce((s, o) => s + o.total, 0);

//   function markProgress(id) {
//     updateOrderStatus(id, 'progress');
//     showToast('🔵 Order marked In Progress');
//   }

//   function markDelivered(id) {
//     updateOrderStatus(id, 'delivered');
//     showToast('✅ Order marked Delivered!');
//     const order = orders.find((o) => o.id === id);
//     if (order) sendFeedbackWhatsApp(order);
//   }

//   function sendFeedbackWhatsApp(order) {
//     // In production: call WhatsApp Cloud API with feedback URL
//     const feedbackUrl = `${window.location.origin}/feedback/${order.id}`;
//     const msg = encodeURIComponent(
//       `Hi ${order.name}! 🎉 Your SpiceFest order #${order.id} has been delivered.\n\nHow was your experience? Share your feedback:\n${feedbackUrl}\n\nThank you! 🙏`
//     );
//     const cleaned = order.phone.replace(/\D/g, '');
//     console.log(`📱 Feedback link sent to ${order.phone}: ${feedbackUrl}`);
//     window.open(`https://wa.me/${cleaned}?text=${msg}`, '_blank');
//   }

//   function openWhatsApp(order, statusMsg) {
//     const cleaned = order.phone.replace(/\D/g, '');
//     const msg = encodeURIComponent(
//       `Hi ${order.name}! Your SpiceFest order #${order.id} ${statusMsg} 🙏`
//     );
//     window.open(`https://wa.me/${cleaned}?text=${msg}`, '_blank');
//   }

//   const sorted = [...orders].reverse();

//   return (
//     <div className="admin-page">
//       {/* HEADER */}
//       <div className="admin-hero">
//         <h2>Kitchen Dashboard</h2>
//         <p>Manage incoming orders · update status · notify customers</p>
//       </div>

//       {/* STATS */}
//       <div className="admin-stats">
//         <div className="stat-card">
//           <div className="stat-val" style={{ color: 'var(--yellow)' }}>{newOrders.length}</div>
//           <div className="stat-lbl">New Orders</div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-val" style={{ color: 'var(--primary)' }}>{progressOrders.length}</div>
//           <div className="stat-lbl">In Progress</div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-val" style={{ color: 'var(--green)' }}>{deliveredOrders.length}</div>
//           <div className="stat-lbl">Delivered</div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-val" style={{ color: '#8b5cf6' }}>
//             ₹{revenue.toLocaleString('en-IN')}
//           </div>
//           <div className="stat-lbl">Today&apos;s Revenue</div>
//         </div>
//       </div>

//       {/* ORDERS */}
//       {!orders.length && (
//         <div className="empty-state">
//           <div className="ico">📋</div>
//           <p>No orders yet. Share your menu link with customers!</p>
//         </div>
//       )}

//       {sorted.map((order) => (
//         <div key={order.id} className="order-card">
//           <div className="order-top">
//             <div>
//               <h4>#{order.id} — {order.name}</h4>
//               <small>
//                 📞 {order.phone} &nbsp;|&nbsp;
//                 👥 {order.party} people &nbsp;|&nbsp;
//                 🕐 {order.time} &nbsp;|&nbsp;
//                 💳 {order.payment.toUpperCase()}
//               </small>
//             </div>
//             <span
//               className={`badge ${
//                 order.status === 'new'
//                   ? 'badge-new'
//                   : order.status === 'progress'
//                   ? 'badge-progress'
//                   : 'badge-delivered'
//               }`}
//             >
//               {order.status === 'new'
//                 ? '🟡 New'
//                 : order.status === 'progress'
//                 ? '🔵 In Progress'
//                 : '✅ Delivered'}
//             </span>
//           </div>

//           <div className="order-items">
//             {order.items.map((i) => `${i.name} ×${i.qty}`).join(' · ')}
//             {order.note && (
//               <span> &nbsp;|&nbsp; 📝 <em>{order.note}</em></span>
//             )}
//           </div>
//           <div className="order-items" style={{ fontSize: '0.82rem' }}>
//             📍 {order.address}
//           </div>

//           <div className="order-total">₹{order.total}</div>

//           <div className="order-actions">
//             {order.status === 'new' && (
//               <button className="action-btn accept" onClick={() => markProgress(order.id)}>
//                 ▶ Mark In Progress
//               </button>
//             )}
//             {order.status === 'progress' && (
//               <button className="action-btn deliver" onClick={() => markDelivered(order.id)}>
//                 ✅ Mark Delivered
//               </button>
//             )}
//             <button
//               className="action-btn wa"
//               onClick={() =>
//                 openWhatsApp(
//                   order,
//                   order.status === 'progress'
//                     ? 'is being prepared 👨‍🍳'
//                     : order.status === 'delivered'
//                     ? 'has been delivered! Enjoy 🎉'
//                     : 'has been received ✅'
//                 )
//               }
//             >
//               📱 WhatsApp
//             </button>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }

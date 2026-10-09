const INITIAL_DATA = {
  rooms: [
    { id: 101, type: "Deluxe King", price: 8500, status: "Occupied", floor: 1 },
    { id: 102, type: "Twin Bed Room", price: 6500, status: "Available", floor: 1 },
    { id: 103, type: "Deluxe King", price: 8500, status: "Cleaning", floor: 1 },
    { id: 201, type: "Executive Suite", price: 15000, status: "Occupied", floor: 2 },
    { id: 202, type: "Executive Suite", price: 15000, status: "Available", floor: 2 },
    { id: 301, type: "Presidential Suite", price: 35000, status: "Maintenance", floor: 3 },
    { id: 302, type: "Presidential Suite", price: 35000, status: "Available", floor: 3 }
  ],
  bookings: [
    { id: "BK-8041", guestName: "Evelyn Vance", roomNumber: 101, checkIn: "2026-03-28", checkOut: "2026-04-02", amount: 42500, status: "Checked-In", extraCharges: [{ desc: "Spa Treatment", amount: 4500 }] },
    { id: "BK-8042", guestName: "Marcus Sterling", roomNumber: 201, checkIn: "2026-03-29", checkOut: "2026-04-03", amount: 75000, status: "Checked-In", extraCharges: [] },
    { id: "BK-8043", guestName: "Sophia Thorne", roomNumber: 102, checkIn: "2026-03-31", checkOut: "2026-04-04", amount: 26000, status: "Confirmed", extraCharges: [] }
  ],
  guests: [
    { id: "G-101", name: "Evelyn Vance", email: "evelyn@vance.com", phone: "+91 98765 43210", totalSpend: 115000, vipTier: "Gold VIP" },
    { id: "G-102", name: "Marcus Sterling", email: "m.sterling@corp.com", phone: "+91 98111 22233", totalSpend: 240000, vipTier: "Platinum VIP" },
    { id: "G-103", name: "Sophia Thorne", email: "sthorne@gmail.com", phone: "+91 99000 11223", totalSpend: 26000, vipTier: "Standard" }
  ],
  tasks: [
    { id: "T-1", roomNumber: 103, staff: "Maria Santos", priority: "High", status: "Pending" },
    { id: "T-2", roomNumber: 301, staff: "Dave Miller", priority: "Urgent", status: "In Progress" }
  ]
};

// Application State
let appState = {
  rooms: JSON.parse(localStorage.getItem('groyale_rooms')) || INITIAL_DATA.rooms,
  bookings: JSON.parse(localStorage.getItem('groyale_bookings')) || INITIAL_DATA.bookings,
  guests: JSON.parse(localStorage.getItem('groyale_guests')) || INITIAL_DATA.guests,
  tasks: JSON.parse(localStorage.getItem('groyale_tasks')) || INITIAL_DATA.tasks
};

function saveState() {
  localStorage.setItem('groyale_rooms', JSON.stringify(appState.rooms));
  localStorage.setItem('groyale_bookings', JSON.stringify(appState.bookings));
  localStorage.setItem('groyale_guests', JSON.stringify(appState.guests));
  localStorage.setItem('groyale_tasks', JSON.stringify(appState.tasks));
  refreshAllViews();
}

/* Router */
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-target');
    navigateTo(target);
  });
});

function navigateTo(targetId) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

  const activeNav = document.querySelector(`[data-target="${targetId}"]`);
  if (activeNav) activeNav.classList.add('active');

  const activeSection = document.getElementById(targetId);
  if (activeSection) activeSection.classList.add('active');
}

/* Master Refresh */
function refreshAllViews() {
  renderDashboard();
  renderRoomsGrid();
  renderBookingsTable();
  renderGuestsList();
  populateBillingSelect();
  renderHousekeeping();
  renderAnalytics();
}

/* View 1: Dashboard */
function renderDashboard() {
  const total = appState.rooms.length;
  const occupied = appState.rooms.filter(r => r.status === 'Occupied').length;
  const cleaning = appState.rooms.filter(r => r.status === 'Cleaning').length;
  const occRate = Math.round((occupied / total) * 100) || 0;

  document.getElementById('kpi-occupancy').innerText = `${occRate}%`;
  document.getElementById('kpi-occupied-count').innerText = occupied;
  document.getElementById('kpi-total-rooms').innerText = total;
  document.getElementById('kpi-cleaning').innerText = cleaning;

  const totalRev = appState.bookings.reduce((sum, b) => sum + b.amount, 0);
  document.getElementById('kpi-today-revenue').innerText = `₹${totalRev.toLocaleString('en-IN')}`;

  const pending = appState.bookings.filter(b => b.status === 'Confirmed');
  document.getElementById('kpi-arrivals').innerText = pending.length;
  document.getElementById('kpi-pending-checkin').innerText = pending.length;

  const summaryBox = document.getElementById('dash-room-status-summary');
  summaryBox.innerHTML = appState.rooms.map(r => `
    <div class="mini-room-pill ${r.status}" onclick="quickOpenRoomModal(${r.id})">
      ${r.id}
    </div>
  `).join('');

  const table = document.getElementById('dash-checkins-table');
  table.innerHTML = pending.map(b => `
    <tr>
      <td><strong>${b.guestName}</strong></td>
      <td>Room ${b.roomNumber}</td>
      <td>${b.checkIn}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="checkInGuest('${b.id}')">Check-In</button>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="4" style="text-align:center; color:#777;">No pending check-ins for today.</td></tr>`;
}

/* View 2: Room Grid */
function renderRoomsGrid() {
  const container = document.getElementById('rooms-grid-container');
  const statusFilter = document.getElementById('room-status-filter').value;
  const typeFilter = document.getElementById('room-type-filter').value;

  const filtered = appState.rooms.filter(r => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchType = typeFilter === 'all' || r.type === typeFilter;
    return matchStatus && matchType;
  });

  container.innerHTML = filtered.map(r => `
    <div class="room-card">
      <div class="room-card-header">
        <span class="room-number">Room ${r.id}</span>
        <span class="badge badge-${getBadgeType(r.status)}">${r.status}</span>
      </div>
      <div class="room-type">${r.type} • Floor ${r.floor}</div>
      <div class="room-price">₹${r.price.toLocaleString('en-IN')} <span style="font-size:12px; font-weight:normal; color:#aaa;">/ night</span></div>
      <div class="room-actions">
        <button class="btn btn-outline btn-sm" style="flex:1" onclick="quickOpenRoomModal(${r.id})">Change Status</button>
      </div>
    </div>
  `).join('');
}

function filterRooms() { renderRoomsGrid(); }

function getBadgeType(status) {
  switch (status) {
    case 'Available': return 'success';
    case 'Occupied': return 'danger';
    case 'Cleaning': return 'warning';
    default: return 'info';
  }
}

/* View 3: Bookings Table */
let currentBookingTab = 'all';

function switchBookingTab(tab) {
  currentBookingTab = tab;
  document.querySelectorAll('.tab-group .tab-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  renderBookingsTable();
}

function renderBookingsTable() {
  const search = document.getElementById('booking-search').value.toLowerCase();
  const tableBody = document.getElementById('bookings-table-body');

  const filtered = appState.bookings.filter(b => {
    const matchesTab = currentBookingTab === 'all' || b.status === currentBookingTab;
    const matchesSearch = b.guestName.toLowerCase().includes(search) || b.roomNumber.toString().includes(search);
    return matchesTab && matchesSearch;
  });

  tableBody.innerHTML = filtered.map(b => `
    <tr>
      <td><strong>${b.id}</strong></td>
      <td>${b.guestName}</td>
      <td>Room ${b.roomNumber}</td>
      <td>${b.checkIn} to ${b.checkOut}</td>
      <td>₹${b.amount.toLocaleString('en-IN')}</td>
      <td><span class="badge badge-${b.status === 'Checked-In' ? 'success' : 'warning'}">${b.status}</span></td>
      <td>
        ${b.status === 'Confirmed' ? `<button class="btn btn-sm btn-primary" onclick="checkInGuest('${b.id}')">Check-In</button>` : ''}
        ${b.status === 'Checked-In' ? `<button class="btn btn-sm btn-outline" onclick="jumpToBilling('${b.id}')">Bill & Checkout</button>` : ''}
      </td>
    </tr>
  `).join('');
}

function checkInGuest(bookingId) {
  const bk = appState.bookings.find(b => b.id === bookingId);
  if (bk) {
    bk.status = 'Checked-In';
    const rm = appState.rooms.find(r => r.id === bk.roomNumber);
    if (rm) rm.status = 'Occupied';
    showToast(`Checked in ${bk.guestName}`);
    saveState();
  }
}

/* View 4: Guest CRM */
function renderGuestsList() {
  const container = document.getElementById('guests-cards-container');
  container.innerHTML = appState.guests.map(g => `
    <div class="guest-card">
      <div class="guest-header">
        <div class="guest-avatar">${g.name.split(' ').map(n=>n[0]).join('')}</div>
        <div>
          <h3 style="font-size:15px;">${g.name}</h3>
          <span class="badge badge-info">${g.vipTier}</span>
        </div>
      </div>
      <div style="font-size:12px; color: var(--text-muted); line-height: 1.6;">
        <p><i class="fa-solid fa-envelope"></i> ${g.email}</p>
        <p><i class="fa-solid fa-phone"></i> ${g.phone}</p>
        <p style="margin-top:8px;"><strong>Total Lifetime Spend:</strong> <span style="color:var(--primary-gold-light);">₹${g.totalSpend.toLocaleString('en-IN')}</span></p>
      </div>
    </div>
  `).join('');
}

/* View 5: Billing & Document Generation Engine */
function populateBillingSelect() {
  const select = document.getElementById('billing-booking-select');
  const activeStays = appState.bookings.filter(b => b.status === 'Checked-In');
  select.innerHTML = '<option value="">-- Choose active stay --</option>' + 
    activeStays.map(b => `<option value="${b.id}">${b.guestName} - Room ${b.roomNumber}</option>`).join('');
}

let selectedFolioBooking = null;

function loadBillingFolio() {
  const id = document.getElementById('billing-booking-select').value;
  selectedFolioBooking = appState.bookings.find(b => b.id === id);

  const controls = document.getElementById('folio-charge-controls');
  const btnSettle = document.getElementById('btn-settle-invoice');

  if (!selectedFolioBooking) {
    controls.style.display = 'none';
    btnSettle.style.display = 'none';
    document.getElementById('inv-items-body').innerHTML = `<tr><td colspan="2" class="text-center" style="color:#777; padding:20px;">Select a guest to calculate charges.</td></tr>`;
    return;
  }

  controls.style.display = 'block';
  btnSettle.style.display = 'inline-block';

  document.getElementById('inv-num').innerText = `INV-${selectedFolioBooking.id.split('-')[1]}`;
  document.getElementById('inv-date').innerText = new Date().toLocaleDateString('en-IN');
  document.getElementById('inv-guest-name').innerText = selectedFolioBooking.guestName;
  document.getElementById('inv-room').innerText = `Room ${selectedFolioBooking.roomNumber}`;
  document.getElementById('inv-dates').innerText = `${selectedFolioBooking.checkIn} to ${selectedFolioBooking.checkOut}`;

  let items = [{ desc: `Room Accommodation (${selectedFolioBooking.roomNumber})`, amount: selectedFolioBooking.amount }];
  if (selectedFolioBooking.extraCharges) {
    items = items.concat(selectedFolioBooking.extraCharges);
  }

  const subtotal = items.reduce((sum, i) => sum + i.amount, 0);
  const tax = subtotal * 0.18; // 18% GST
  const grandTotal = subtotal + tax;

  document.getElementById('inv-items-body').innerHTML = items.map(i => `
    <tr>
      <td>${i.desc}</td>
      <td style="text-align:right;">₹${i.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    </tr>
  `).join('');

  document.getElementById('inv-subtotal').innerText = `₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  document.getElementById('inv-tax').innerText = `₹${tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  document.getElementById('inv-total').innerText = `₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function addExtraCharge() {
  if (!selectedFolioBooking) return;
  const desc = document.getElementById('charge-desc').value;
  const amount = parseFloat(document.getElementById('charge-amount').value);

  if (desc && amount) {
    if (!selectedFolioBooking.extraCharges) selectedFolioBooking.extraCharges = [];
    selectedFolioBooking.extraCharges.push({ desc, amount });
    document.getElementById('charge-desc').value = '';
    document.getElementById('charge-amount').value = '';
    saveState();
    loadBillingFolio();
    showToast('Extra charge added to folio');
  }
}

function jumpToBilling(bookingId) {
  navigateTo('billing-section');
  document.getElementById('billing-booking-select').value = bookingId;
  loadBillingFolio();
}

function settleAndCheckout() {
  if (!selectedFolioBooking) return;

  selectedFolioBooking.status = 'Checked-Out';
  const rm = appState.rooms.find(r => r.id === selectedFolioBooking.roomNumber);
  if (rm) rm.status = 'Cleaning';

  showToast(`Folio settled. Room ${rm.id} moved to cleaning queue.`);
  saveState();
  loadBillingFolio();
}

/* DOWNLOAD PDF */
function downloadInvoicePDF() {
  if (!selectedFolioBooking) {
    showToast('Please select an active stay first.');
    return;
  }
  const element = document.getElementById('invoice-printable-area');
  
  html2canvas(element, { scale: 2 }).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save(`Invoice_${selectedFolioBooking.id}.pdf`);
    showToast('PDF downloaded successfully');
  });
}

/* DOWNLOAD EXCEL */
function downloadInvoiceExcel() {
  if (!selectedFolioBooking) {
    showToast('Please select an active stay first.');
    return;
  }

  let items = [{ Description: `Room Accommodation (${selectedFolioBooking.roomNumber})`, "Amount (INR)": selectedFolioBooking.amount }];
  if (selectedFolioBooking.extraCharges) {
    selectedFolioBooking.extraCharges.forEach(ch => {
      items.push({ Description: ch.desc, "Amount (INR)": ch.amount });
    });
  }

  const subtotal = items.reduce((sum, i) => sum + i["Amount (INR)"], 0);
  const tax = subtotal * 0.18;
  const grandTotal = subtotal + tax;

  items.push({ Description: "", "Amount (INR)": "" });
  items.push({ Description: "Subtotal", "Amount (INR)": subtotal });
  items.push({ Description: "GST & Service Charge (18%)", "Amount (INR)": tax });
  items.push({ Description: "Grand Total", "Amount (INR)": grandTotal });

  const worksheet = XLSX.utils.json_to_sheet(items);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Folio Invoice");

  XLSX.writeFile(workbook, `Invoice_${selectedFolioBooking.id}.xlsx`);
  showToast('Excel file downloaded successfully');
}

/* View 6: Housekeeping */
function renderHousekeeping() {
  const container = document.getElementById('housekeeping-grid');
  container.innerHTML = appState.tasks.map(t => `
    <div class="task-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <strong>Room ${t.roomNumber}</strong>
        <span class="badge badge-${t.priority === 'Urgent' ? 'danger' : 'warning'}">${t.priority}</span>
      </div>
      <p style="font-size:12px; color:var(--text-muted);">Assigned to: ${t.staff}</p>
      <div style="margin-top:14px; display:flex; gap:8px;">
        <button class="btn btn-sm btn-success" onclick="completeTask('${t.id}')">Mark Cleaned</button>
      </div>
    </div>
  `).join('');
}

function completeTask(taskId) {
  const task = appState.tasks.find(t => t.id === taskId);
  if (task) {
    const rm = appState.rooms.find(r => r.id === task.roomNumber);
    if (rm) rm.status = 'Available';
    appState.tasks = appState.tasks.filter(t => t.id !== taskId);
    showToast(`Room ${task.roomNumber} marked clean & available`);
    saveState();
  }
}

/* View 7: Analytics Reports */
function renderAnalytics() {
  const barContainer = document.getElementById('revenue-chart-bars');
  const revenueData = [
    { type: 'Deluxe King', amount: 170000 },
    { type: 'Exec Suite', amount: 300000 },
    { type: 'Presidential', amount: 525000 },
    { type: 'Twin Bed', amount: 130000 }
  ];

  const maxVal = Math.max(...revenueData.map(d => d.amount));

  barContainer.innerHTML = revenueData.map(d => `
    <div class="chart-bar-wrap">
      <div class="chart-bar" style="height: ${(d.amount / maxVal) * 100}%;"></div>
      <span class="chart-label">${d.type}</span>
    </div>
  `).join('');
}

/* Modal Helpers */
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function openBookingModal() {
  const select = document.getElementById('bk-room-select');
  select.innerHTML = appState.rooms.filter(r => r.status === 'Available').map(r => `
    <option value="${r.id}">Room ${r.id} (${r.type} - ₹${r.price.toLocaleString('en-IN')})</option>
  `).join('');
  openModal('modal-booking');
}

function handleSaveBooking(e) {
  e.preventDefault();
  const name = document.getElementById('bk-guest-name').value;
  const room = parseInt(document.getElementById('bk-room-select').value);
  const checkIn = document.getElementById('bk-checkin').value;
  const checkOut = document.getElementById('bk-checkout').value;

  const rm = appState.rooms.find(r => r.id === room);

  const newBk = {
    id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
    guestName: name,
    roomNumber: room,
    checkIn,
    checkOut,
    amount: rm ? rm.price * 2 : 15000,
    status: 'Confirmed',
    extraCharges: []
  };

  appState.bookings.push(newBk);
  showToast('New reservation created successfully');
  closeModal('modal-booking');
  saveState();
}

function quickOpenRoomModal(roomId) {
  const rm = appState.rooms.find(r => r.id === roomId);
  if (rm) {
    document.getElementById('room-modal-id').value = rm.id;
    document.getElementById('room-modal-num').innerText = rm.id;
    document.getElementById('room-modal-status-select').value = rm.status;
    openModal('modal-room-status');
  }
}

function handleSaveRoomStatus() {
  const id = parseInt(document.getElementById('room-modal-id').value);
  const status = document.getElementById('room-modal-status-select').value;
  const rm = appState.rooms.find(r => r.id === id);
  if (rm) {
    rm.status = status;
    showToast(`Room ${id} status updated to ${status}`);
    closeModal('modal-room-status');
    saveState();
  }
}

function openGuestModal() { openModal('modal-guest'); }

function handleSaveGuest(e) {
  e.preventDefault();
  const name = document.getElementById('gst-name').value;
  const email = document.getElementById('gst-email').value;
  const phone = document.getElementById('gst-phone').value;
  const vip = document.getElementById('gst-vip').value;

  appState.guests.push({
    id: `G-${Math.floor(100 + Math.random() * 900)}`,
    name, email, phone, totalSpend: 0, vipTier: vip
  });

  showToast('Guest profile created');
  closeModal('modal-guest');
  saveState();
}

function openTaskModal() {
  const select = document.getElementById('task-room-select');
  select.innerHTML = appState.rooms.map(r => `<option value="${r.id}">Room ${r.id}</option>`).join('');
  openModal('modal-task');
}

function handleSaveTask(e) {
  e.preventDefault();
  const room = parseInt(document.getElementById('task-room-select').value);
  const staff = document.getElementById('task-staff').value;
  const priority = document.getElementById('task-priority').value;

  appState.tasks.push({
    id: `T-${Math.floor(10 + Math.random() * 90)}`,
    roomNumber: room,
    staff,
    priority,
    status: 'Pending'
  });

  showToast('Housekeeping task assigned');
  closeModal('modal-task');
  saveState();
}

/* Toast Notifications */
function showToast(msg) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

/* Live Clock */
setInterval(() => {
  const now = new Date();
  document.getElementById('live-time').innerText = now.toLocaleTimeString('en-IN');
}, 1000);

/* App Entry Point */
window.addEventListener('DOMContentLoaded', () => {
  refreshAllViews();
});
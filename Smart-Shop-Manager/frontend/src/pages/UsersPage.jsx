import { useEffect, useState } from "react";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import { approveUser, deleteOrRejectUser, getAllUsers } from "../services/adminUserService";
import { getApiErrorMessage } from "../services/apiErrors";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tabIndex, setTabIndex] = useState(0); // 0 = Pending, 1 = All Users

  const [confirmDialog, setConfirmDialog] = useState({ open: false, user: null, action: null });
  const [actionLoading, setActionLoading] = useState(false);

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load users list. Admin permissions required."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    getAllUsers()
      .then((data) => {
        if (active) {
          setUsers(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(getApiErrorMessage(err, "Failed to load users list. Admin permissions required."));
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const pendingUsers = users.filter((u) => !u.approved);

  async function handleApprove(user) {
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      await approveUser(user.id);
      setSuccess(`Account for "${user.username}" approved successfully! They can now sign in.`);
      await loadUsers();
    } catch (err) {
      setError(getApiErrorMessage(err, `Failed to approve "${user.username}".`));
    } finally {
      setActionLoading(false);
      setConfirmDialog({ open: false, user: null, action: null });
    }
  }

  async function handleReject(user) {
    setActionLoading(true);
    setError("");
    setSuccess("");
    try {
      await deleteOrRejectUser(user.id);
      setSuccess(`Account "${user.username}" was rejected and removed.`);
      await loadUsers();
    } catch (err) {
      setError(getApiErrorMessage(err, `Failed to remove user "${user.username}".`));
    } finally {
      setActionLoading(false);
      setConfirmDialog({ open: false, user: null, action: null });
    }
  }

  const displayedUsers = tabIndex === 0 ? pendingUsers : users;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
        >
          <Box>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <HowToRegIcon color="primary" sx={{ fontSize: 32 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: "1.5rem", sm: "2rem" } }}>
                User Approvals
              </Typography>
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Review and approve newly registered user accounts before they can access store data.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadUsers}
            disabled={loading}
            sx={{ alignSelf: { xs: "flex-start", sm: "center" }, borderRadius: 2 }}
          >
            Refresh
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError("")} sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" onClose={() => setSuccess("")} sx={{ borderRadius: 2 }}>
            {success}
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Tabs
            value={tabIndex}
            onChange={(e, val) => setTabIndex(val)}
            indicatorColor="primary"
            textColor="primary"
            sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}
          >
            <Tab
              label={
                <Badge badgeContent={pendingUsers.length} color="error" sx={{ "& .MuiBadge-badge": { right: -12, top: 2 } }}>
                  Pending Approvals
                </Badge>
              }
              sx={{ fontWeight: 600, py: 2 }}
            />
            <Tab label={`All Accounts (${users.length})`} sx={{ fontWeight: 600, py: 2 }} />
          </Tabs>

          {loading ? (
            <Box sx={{ p: 6, display: "grid", placeItems: "center" }}>
              <CircularProgress />
            </Box>
          ) : displayedUsers.length === 0 ? (
            <Box sx={{ p: 6, textAlign: "center" }}>
              <HourglassEmptyIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
              <Typography variant="h6" color="text.secondary">
                {tabIndex === 0 ? "No pending account approvals" : "No users found"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {tabIndex === 0
                  ? "When new users register from the sign-up page, they will appear here for verification."
                  : "Registered user accounts will be listed here."}
              </Typography>
            </Box>
          ) : (
            <>
              {/* Desktop Table View */}
              <TableContainer sx={{ display: { xs: "none", md: "block" } }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#FAF7F2" }}>
                      <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Approval Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayedUsers.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                bgcolor: user.role === "ROLE_ADMIN" ? "primary.100" : "grey.100",
                                color: user.role === "ROLE_ADMIN" ? "primary.main" : "text.secondary",
                                display: "grid",
                                placeItems: "center",
                              }}
                            >
                              {user.role === "ROLE_ADMIN" ? (
                                <ShieldOutlinedIcon fontSize="small" />
                              ) : (
                                <PersonOutlinedIcon fontSize="small" />
                              )}
                            </Box>
                            <Box>
                              <Typography sx={{ fontWeight: 600 }}>{user.username}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: #{user.id}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.role === "ROLE_ADMIN" ? "Administrator" : "User / Staff"}
                            size="small"
                            color={user.role === "ROLE_ADMIN" ? "primary" : "default"}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {user.approved ? (
                            <Chip
                              icon={<CheckCircleOutlinedIcon />}
                              label="Approved"
                              size="small"
                              color="success"
                              variant="filled"
                            />
                          ) : (
                            <Chip
                              icon={<HourglassEmptyIcon />}
                              label="Pending Approval"
                              size="small"
                              color="warning"
                              variant="filled"
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                            {!user.approved && (
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                startIcon={<CheckCircleOutlinedIcon />}
                                onClick={() => handleApprove(user)}
                                disabled={actionLoading}
                                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                              >
                                Approve
                              </Button>
                            )}
                            {!(user.role === "ROLE_ADMIN" && user.username === "admin") && (
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<DeleteOutlineOutlinedIcon />}
                                onClick={() =>
                                  setConfirmDialog({
                                    open: true,
                                    user,
                                    action: user.approved ? "delete" : "reject",
                                  })
                                }
                                disabled={actionLoading}
                                sx={{ borderRadius: 2, textTransform: "none" }}
                              >
                                {user.approved ? "Delete" : "Reject"}
                              </Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Mobile Card View */}
              <Box sx={{ display: { xs: "block", md: "none" }, p: 2 }}>
                <Stack spacing={2}>
                  {displayedUsers.map((user) => (
                    <Card key={user.id} variant="outlined" sx={{ borderRadius: 2.5 }}>
                      <CardContent sx={{ pb: 1.5 }}>
                        <Stack spacing={1.5}>
                          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: "50%",
                                  bgcolor: user.role === "ROLE_ADMIN" ? "primary.100" : "grey.100",
                                  color: user.role === "ROLE_ADMIN" ? "primary.main" : "text.secondary",
                                  display: "grid",
                                  placeItems: "center",
                                }}
                              >
                                {user.role === "ROLE_ADMIN" ? (
                                  <ShieldOutlinedIcon fontSize="small" />
                                ) : (
                                  <PersonOutlinedIcon fontSize="small" />
                                )}
                              </Box>
                              <Box>
                                <Typography sx={{ fontWeight: 700 }}>{user.username}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ID: #{user.id} • {user.role === "ROLE_ADMIN" ? "Admin" : "User"}
                                </Typography>
                              </Box>
                            </Stack>

                            {user.approved ? (
                              <Chip label="Approved" size="small" color="success" />
                            ) : (
                              <Chip label="Pending" size="small" color="warning" />
                            )}
                          </Stack>

                          <Divider />

                          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                            {!user.approved && (
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                startIcon={<CheckCircleOutlinedIcon />}
                                onClick={() => handleApprove(user)}
                                disabled={actionLoading}
                                fullWidth
                                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                              >
                                Approve
                              </Button>
                            )}
                            {!(user.role === "ROLE_ADMIN" && user.username === "admin") && (
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<DeleteOutlineOutlinedIcon />}
                                onClick={() =>
                                  setConfirmDialog({
                                    open: true,
                                    user,
                                    action: user.approved ? "delete" : "reject",
                                  })
                                }
                                disabled={actionLoading}
                                sx={{ borderRadius: 2, textTransform: "none" }}
                              >
                                {user.approved ? "Delete" : "Reject"}
                              </Button>
                            )}
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            </>
          )}
        </Paper>
      </Stack>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, user: null, action: null })}>
        <DialogTitle>
          {confirmDialog.action === "reject" ? "Reject Registration Request?" : "Delete User Account?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.action === "reject"
              ? `Are you sure you want to reject the registration request for "${confirmDialog.user?.username}"? This account will be removed.`
              : `Are you sure you want to delete the account for "${confirmDialog.user?.username}"? This action cannot be undone.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmDialog({ open: false, user: null, action: null })} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => handleReject(confirmDialog.user)}
            disabled={actionLoading}
          >
            {confirmDialog.action === "reject" ? "Reject & Remove" : "Delete Account"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

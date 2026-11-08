import { useEffect, useState } from "react";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
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
  IconButton,
  InputAdornment,
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
  TextField,
  Typography,
} from "@mui/material";
import { approveUser, deleteOrRejectUser, getAllUsers, resetUserPassword } from "../services/adminUserService";
import { getApiErrorMessage } from "../services/apiErrors";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tabIndex, setTabIndex] = useState(0); // 0 = Pending, 1 = All Users

  const [confirmDialog, setConfirmDialog] = useState({ open: false, user: null, action: null });
  const [actionLoading, setActionLoading] = useState(false);

  // Reset password dialog state
  const [resetDialog, setResetDialog] = useState({
    open: false,
    username: "",
    newPassword: "",
    error: "",
    loading: false,
    showPassword: false,
  });

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

  function openResetPassword(targetUsername = "") {
    setResetDialog({
      open: true,
      username: targetUsername,
      newPassword: "",
      error: "",
      loading: false,
      showPassword: false,
    });
  }

  async function handleResetPasswordSubmit(event) {
    event.preventDefault();
    const trimmedUsername = resetDialog.username.trim();
    if (!trimmedUsername) {
      setResetDialog((prev) => ({ ...prev, error: "Username is required." }));
      return;
    }
    if (!resetDialog.newPassword || resetDialog.newPassword.length < 8) {
      setResetDialog((prev) => ({
        ...prev,
        error: "New password must be at least 8 characters long.",
      }));
      return;
    }

    setResetDialog((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const response = await resetUserPassword(trimmedUsername, resetDialog.newPassword);
      setSuccess(response.message || `Password reset successfully for user: ${trimmedUsername}`);
      setResetDialog({
        open: false,
        username: "",
        newPassword: "",
        error: "",
        loading: false,
        showPassword: false,
      });
    } catch (err) {
      setResetDialog((prev) => ({
        ...prev,
        loading: false,
        error: getApiErrorMessage(err, `Failed to reset password for "${trimmedUsername}".`),
      }));
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

          <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}>
            <Button
              variant="outlined"
              startIcon={<LockResetOutlinedIcon />}
              onClick={() => openResetPassword("")}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              Reset password
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadUsers}
              disabled={loading}
              sx={{ borderRadius: 2 }}
            >
              Refresh
            </Button>
          </Stack>
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
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 240 }}>
              <CircularProgress />
            </Box>
          ) : displayedUsers.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <HourglassEmptyIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
              <Typography variant="h6" color="text.secondary">
                {tabIndex === 0 ? "No Pending Approvals" : "No Users Found"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {tabIndex === 0
                  ? "All registered accounts have been reviewed and approved."
                  : "No user accounts are currently present."}
              </Typography>
            </Box>
          ) : (
            <>
              {/* Desktop Table View */}
              <TableContainer sx={{ display: { xs: "none", md: "block" } }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "background.default" }}>
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
                                bgcolor: user.role === "ROLE_ADMIN" ? "primary.100" : "action.hover",
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
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<LockResetOutlinedIcon />}
                              onClick={() => openResetPassword(user.username)}
                              disabled={actionLoading}
                              sx={{ borderRadius: 2, textTransform: "none" }}
                            >
                              Reset password
                            </Button>
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
                                  bgcolor: user.role === "ROLE_ADMIN" ? "primary.100" : "action.hover",
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

                          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", flexWrap: "wrap", gap: 1 }}>
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
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<LockResetOutlinedIcon />}
                              onClick={() => openResetPassword(user.username)}
                              disabled={actionLoading}
                              fullWidth
                              sx={{ borderRadius: 2, textTransform: "none" }}
                            >
                              Reset password
                            </Button>
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
                                fullWidth
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

      {/* Reset Password Dialog */}
      <Dialog
        open={resetDialog.open}
        onClose={() => !resetDialog.loading && setResetDialog((prev) => ({ ...prev, open: false }))}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            component: "form",
            onSubmit: handleResetPasswordSubmit,
          },
        }}
      >
        <DialogTitle>Reset User Password</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {resetDialog.error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {resetDialog.error}
              </Alert>
            )}
            <DialogContentText variant="body2">
              Enter the username and new password (minimum 8 characters) to reset this account&apos;s credentials.
            </DialogContentText>
            <TextField
              label="Username"
              value={resetDialog.username}
              onChange={(e) => setResetDialog((prev) => ({ ...prev, username: e.target.value, error: "" }))}
              required
              fullWidth
              autoFocus={!resetDialog.username}
              disabled={resetDialog.loading}
            />
            <TextField
              label="New Password"
              type={resetDialog.showPassword ? "text" : "password"}
              value={resetDialog.newPassword}
              onChange={(e) => setResetDialog((prev) => ({ ...prev, newPassword: e.target.value, error: "" }))}
              required
              fullWidth
              autoFocus={Boolean(resetDialog.username)}
              disabled={resetDialog.loading}
              helperText="Must be at least 8 characters long"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={resetDialog.showPassword ? "Hide password" : "Show password"}
                        onClick={() => setResetDialog((prev) => ({ ...prev, showPassword: !prev.showPassword }))}
                        edge="end"
                        size="small"
                        tabIndex={-1}
                      >
                        {resetDialog.showPassword ? (
                          <VisibilityOffOutlinedIcon fontSize="small" />
                        ) : (
                          <VisibilityOutlinedIcon fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setResetDialog((prev) => ({ ...prev, open: false }))}
            disabled={resetDialog.loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={resetDialog.loading}
          >
            {resetDialog.loading ? "Resetting…" : "Reset Password"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

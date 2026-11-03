import { Paper, Stack, Typography } from "@mui/material";

export default function EmptyState({ icon, title, message }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 }, textAlign: "center" }}>
      <Stack spacing={1} sx={{ alignItems: "center" }}>
        {icon}
        <Typography variant="h6">{title}</Typography>
        <Typography color="text.secondary">{message}</Typography>
      </Stack>
    </Paper>
  );
}

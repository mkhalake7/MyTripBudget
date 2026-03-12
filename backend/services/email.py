import resend
import os
from typing import Optional

RESEND_API_KEY = os.environ.get("RESEND_API_KEY")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

def send_invitation_email(email: str, name: Optional[str], group_name: str, inviter_name: str, token: str):
    """
    Sends an invitation email to join a group.
    """
    # Use the Vercel URL if available, otherwise fallback
    base_url = os.environ.get("VERCEL_URL", "mytripbudget.vercel.app")
    if not base_url.startswith("http"):
        base_url = f"https://{base_url}"
    
    join_url = f"{base_url}/join/{token}"
    
    if not RESEND_API_KEY:
        print(f"DEBUG: No RESEND_API_KEY set. Invitation link for {email}: {join_url}")
        return True

    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #6366f1;">You've been invited!</h2>
        <p>Hi {name or email},</p>
        <p><strong>{inviter_name}</strong> has invited you to join the budget group <strong>"{group_name}"</strong> on MyTripBudget.</p>
        <p>Track expenses, split bills, and manage your trip budget together!</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{join_url}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Join Group</a>
        </div>
        <p style="font-size: 12px; color: #666;">If the button doesn't work, copy and paste this link into your browser:<br>{join_url}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #999;">This invitation was sent by MyTripBudget. If you didn't expect this, you can safely ignore it.</p>
    </div>
    """

    try:
        params = {
            "from": "MyTripBudget <onboarding@resend.dev>",
            "to": [email],
            "subject": f"Invitation: Join {group_name} on MyTripBudget",
            "html": html_content,
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

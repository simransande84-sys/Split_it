const path = require('path');
const transporter = require('./mailer');
const EMAIL_USER = process.env.EMAIL_USER;
const currencySymbol = require('./data/currencySymbols');


const sendRecurringReminders = async (SplitModel, GroupModel) => {
    if (!SplitModel || !GroupModel) {
        console.error("Models not assigned yet in sendRecurringReminders.");
        return;
    }

    const currentConnectionState = SplitModel.db.readyState;
    console.log(`Checking Mongoose connection state before query: ${currentConnectionState}`);

    if (currentConnectionState !== 1) {
        console.warn(`Mongoose connection not fully ready yet within sendRecurringReminders. State: ${currentConnectionState}.`);
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
        const splits = await SplitModel.find({
            status: "pending",
            dueDate: { $ne: null }
        })
            .populate('createdBy', 'username')
            .populate({
                path: 'group',
                model: GroupModel,
                populate: {
                    path: 'members',
                    model: 'Users'
                }
            });

        console.log(`Found ${splits.length} pending splits with payment deadlines.`);

        for (const split of splits) {
            if (split.status !== 'pending' || split.settledManually === true) continue;
            if (!split.dueDate) continue;

            const dueDate = new Date(split.dueDate);
            dueDate.setHours(0, 0, 0, 0);

            // Calculate difference in days (date-only comparison)
            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            // Reminder rule: Send reminder ONLY if today is exactly ONE DAY BEFORE the payment deadline
            if (diffDays !== 1) {
                console.log(`  Split "${split.title}": ${diffDays} day(s) until deadline (reminder triggers at 1 day before). Skipping.`);
                continue;
            }

            // Identify unpaid members and their debt details
            let unpaidDetails = [];
            if (split.splitDetails && split.splitDetails.length > 0) {
                unpaidDetails = split.splitDetails.filter(detail => !detail.isPaid);
            } else if (split.group?.members?.length > 0) {
                const perPersonAmount = (split.amount / split.group.members.length).toFixed(2);
                unpaidDetails = split.group.members.map(m => ({
                    email: m.email,
                    amount: parseFloat(perPersonAmount),
                    isPaid: false
                }));
            }

            if (unpaidDetails.length === 0) {
                console.log(`  Split "${split.title}": All members have paid. Skipping.`);
                continue;
            }

            const formattedDueDate = dueDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });

            const creatorName = split.createdBy?.username || 'a group member';
            const symbol = currencySymbol[split.currency] || '₹';

            for (const memberDetail of unpaidDetails) {
                const amountOwed = memberDetail.amount || split.amount;
                const email = memberDetail.email;

                try {
                    await transporter.sendMail({
                        from: `"Split_it Reminder" <${EMAIL_USER}>`,
                        to: email,
                        subject: `Reminder: Your payment for ${split.title} is due tomorrow, ${formattedDueDate}`,
                        html: `
        <p>Hi ${email},</p>
        <p>This is a friendly reminder that your payment for <em>${split.title}</em> is due <strong>tomorrow, ${formattedDueDate}</strong>.</p>
        <p>Amount Owed: <strong>${symbol}${amountOwed}</strong> (${split.currency || 'INR'})</p>
        <p>Payable to: <strong>${creatorName}</strong></p>
        ${split.description ? `<p><strong>Note:</strong> ${split.description}</p>` : ''}
        <p>Please make your payment at your earliest convenience.</p>
        <p>Thanks,<br />The Split_it Team</p>
    `
                    });

                    console.log(`📧 Sent 1-day-before reminder to ${email} for split "${split.title}" (Owes ${symbol}${amountOwed})`);
                } catch (mailError) {
                    console.error(`❌ Failed to send email to ${email} for split "${split.title}":`, mailError);
                }
            }
        }
    } catch (error) {
        console.error("Error sending reminders:", error);
    }
};

module.exports = { sendRecurringReminders };

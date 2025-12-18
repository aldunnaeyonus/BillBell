<?php
require __DIR__ . '/../../vendor/autoload.php';

use Dotenv\Dotenv;
use App\Routes;

// Load environment variables
$dotenv = Dotenv::createImmutable('/home/dunncarabali/');
$dotenv->safeLoad();

// 1. ---- ROUTING LOGIC ----
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$page = $_GET['page'] ?? 'home'; 

// Trigger website view for base URL or index.php
if ($path === '/billMVP' || $path === '/billMVP/' || $path === '/billMVP/index.php') {
    $ua = $_SERVER['HTTP_USER_AGENT'];
    $code = $_GET['code'] ?? '';

    // Official App Store Links
    $iosStore = "https://apps.apple.com/app/id-6756393721";
    $androidStore = "https://play.google.com/store/apps/details?id=com.dunn.carabali.billbell";
    $deepLink = "billbell://family" . ($code ? "?code=$code" : "");

    // Device detection for automatic store redirection
    $storeUrl = "https://dunn-carabali.com/billMVP/";
    if (preg_match('/iPhone|iPod|iPad/', $ua)) $storeUrl = $iosStore;
    else if (preg_match('/Android/', $ua)) $storeUrl = $androidStore;

    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>BillBell | Smart Family Bills</title>
        <link rel="icon" type="image/png" href="./favicon.png" />
        <style>
            :root {
                --navy: #0b1f3b;
                --navy-light: #1a2c4e;
                --mint: #71e3c3;
                --bg: #f7f9fc;
                --card-bg: #ffffff;
                --primary-text: #0f172a;
                --subtext: #64748b;
                --border: #e2e8f0;
                --accent: #2563eb;
                --error: #dc2626;
            }

footer {
    text-align: center;
    padding: 24px;
    background-color: var(--card-bg);
    border-top: 1px solid var(--border);
    color: var(--subtext);
    font-size: 13px;
    font-weight: 600;
}

            body { font-family: -apple-system, sans-serif; background-color: var(--bg); color: var(--primary-text); margin: 0; padding-top: 64px; }
            
            header {
                position: fixed; top: 0; left: 0; right: 0; height: 64px;
                background-color: var(--card-bg); display: flex; align-items: center;
                justify-content: space-between; padding: 0 24px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.05); z-index: 1000;
            }

            .logo-container { display: flex; align-items: center; gap: 10px; text-decoration: none; }
            .logo-img { width: 36px; height: 36px; border-radius: 8px; }
            .logo-text { font-size: 20px; font-weight: 800; color: var(--navy); }

            nav a { text-decoration: none; color: var(--navy); font-weight: 600; margin-left: 1.5rem; font-size: 14px; }
            
            .container { width: 100%; max-width: 800px; margin: 0 auto; padding: 40px 16px; display: flex; flex-direction: column; gap: 24px; }
            .hero { text-align: center; background: linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%); padding: 60px 24px; color: #fff; border-radius: 0 0 30px 30px; }
            .card { background: var(--card-bg); border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid var(--border); padding: 24px; }
            
            .btn { display: inline-block; background: var(--navy); color: #fff; text-decoration: none; padding: 16px 32px; border-radius: 16px; font-weight: 700; cursor: pointer; border: 0; text-align: center; }
            .btn-mint { background: var(--mint); color: var(--navy); }
            
            .faq-q { font-weight: 700; cursor: pointer; padding: 16px 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; }
            .faq-a { padding: 12px 0; color: var(--subtext); display: none; font-size: 14px; }
            
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 16px 0; }
            th { text-align: left; padding: 8px; border-bottom: 2px solid var(--border); color: var(--navy); }
            td { padding: 8px; border-bottom: 1px solid var(--border); }
            input { width: 100%; box-sizing: border-box; padding: 12px; margin-top: 6px; border: 1px solid var(--border); border-radius: 12px; background: var(--bg); }
            pre { background: #f1f5f9; padding: 16px; border-radius: 12px; font-size: 13px; border: 1px dashed var(--border); overflow-x: auto; }
        </style>
    </head>
    <body>
        <header>
            <a href="?page=home" class="logo-container">
                <img src="./favicon.png" alt="Logo" class="logo-img" />
                <span class="logo-text">BillBell</span>
            </a>
            <nav>
                <a href="?page=home">Home</a>
                <a href="?page=about">About</a>
                <a href="?page=faq">FAQ</a>
                <a href="?page=upload">Bulk Upload</a>
                <a href="?page=support">Support</a>
                <a href="?page=privacy">Privacy & Data</a>

            </nav>
        </header>


        <?php if ($page === 'home'): ?>
            <div class="hero">
                <h1>Join the Family</h1>
                <p>Sync bills seamlessly across devices.</p>
                <?php if ($code): ?>
                    <div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 12px; display: inline-block; margin: 20px 0; border: 1px dashed #fff;">
                        <small style="text-transform:uppercase; font-weight:700;">Invite Code</small><br/>
                        <b style="font-size: 28px; letter-spacing: 2px;"><?= htmlspecialchars($code) ?></b>
                    </div><br/>
                <?php endif; ?>
                <a href="<?= $storeUrl ?>" class="btn btn-mint" id="main-btn">Get the App</a>
                <script>
                    window.location.href = "<?= $deepLink ?>";
                    setTimeout(() => { document.getElementById('main-btn').href = "<?= $storeUrl ?>"; }, 2500);
                </script>
            </div>

<?php elseif ($page === 'about'): ?>
    <div class="container">
        <h1>Our Philosophy</h1>
        
        <div class="card">
            <h3 style="color: var(--navy); border-bottom: 2px solid var(--mint); padding-bottom: 8px;">
                First-Principle Thinking
            </h3>
            <p>BillBell was not built to be another cluttered "fintech" app. It was built by stripping the problem of shared debt down to its fundamental truths.</p>
            <ul>
                <li><b>Truth 1:</b> Shared bills require absolute transparency between members.</li>
                <li><b>Truth 2:</b> Privacy is non-negotiable; data must be encrypted at the source.</li>
                <li><b>Truth 3:</b> Friction kills consistency. Managing money should be as fast as a tap.</li>
            </ul>
        </div>

        <div class="card">
            <h3 style="color: var(--navy); border-bottom: 2px solid var(--mint); padding-bottom: 8px;">
                Results Over Pleasantries
            </h3>
            <p>We value logic and effectiveness over flattery. Our interface is designed for low-friction communication. We provide the data you need to stay on top of your obligations, formatted for quick scanning and immediate action.</p>
        </div>

        <div class="card">
            <h3 style="color: var(--navy); border-bottom: 2px solid var(--mint); padding-bottom: 8px;">
                Rigorous Security
            </h3>
            <p>BillBell utilizes a decentralized encryption model. When you join a family, your bills are migrated to a new shared ID, but they remain protected by keys held only by your group.</p>
            <p>Because your encryption key lives only on your device, we cannot see your bills, and neither can anyone else outside your trusted circle.</p>
        </div>

        <div class="card" style="text-align: center; background: var(--navy); color: white;">
            <h3 style="color: var(--mint);">Ready for Clarity?</h3>
            <p style="color: white; opacity: 0.9;">Stop guessing. Start tracking with logic.</p>
            <a href="?page=home" class="btn btn-mint">Back to Join</a>
        </div>
    </div>

        <?php elseif ($page === 'faq'): 
    $faqSections = [
        [
            "title" => "Adding & Managing Debts",
            "items" => [
                [ "q" => "How do I add a debt?", "a" => "Go to the Debts screen and tap the '+ Add' button. Enter the creditor, amount, and due date to save." ],
                [ "q" => "How do I edit or update a debt?", "a" => "Tap any debt in the list to open the edit screen where you can update its details." ],
                [ "q" => "How do I delete a debt?", "a" => "Select a debt, then tap the 'Delete' button to remove it permanently." ],
                [ "q" => "What happens when I mark a debt as paid?", "a" => "It moves to the Paid section and future reminders for that debt stop automatically." ]
            ]
        ],
        [
            "title" => "Notifications & Reminders",
            "items" => [
                [ "q" => "When will I receive reminders?", "a" => "You will receive a reminder the day before a debt is due. Your group settings may adjust this reminder window." ],
                [ "q" => "Why am I not receiving notifications?", "a" => "Ensure notifications are enabled for the app in your device settings. Also confirm you're logged in and part of a Group." ],
                [ "q" => "Will reminders sync across all devices?", "a" => "Yes. All connected group members receive reminders for shared debts." ]
            ]
        ],
        [
            "title" => "Families & Sharing",
            "items" => [
                [ "q" => "Can I share my account with someone else?", "a" => "Yes. Share your Share ID so other users can join your group and sync bills." ],
                [ "q" => "How do I invite someone to my group?", "a" => "Go to your Profile or Group screen to find your Share ID. Give this ID to someone you trust so they can join." ],
                [ "q" => "Can multiple people manage the same debts?", "a" => "Absolutely. Anyone in your group can add, edit, pay, or delete shared debts." ],
                [ "q" => "Can I leave a group?", "a" => "Yes. You can leave from the group Settings screen. If you're the only admin, you must assign a new admin first." ]
            ]
        ],
        [
            "title" => "Importing & Bulk Upload",
            "items" => [
                [ "q" => "How does the Import Code work?", "a" => "Group admins can generate a one-time import code. Use it in the Bulk Upload screen to securely import debts from a CSV file." ],
                [ "q" => "What file type can I import?", "a" => "You can import CSV files containing the fields: name, amount, due_date, notes, autopay." ],
                [ "q" => "Can I import multiple debts at once?", "a" => "Yes. Use the Bulk Upload feature to import many debts from a spreadsheet in one step." ],
                [ "q" => "Why did my import fail?", "a" => "Check that your CSV uses valid formatting and that your Import Code has not expired or already been used." ]
            ]
        ],
        [
            "title" => "Account, Login & Security",
            "items" => [
                [ "q" => "How do I sign in?", "a" => "You can sign in using Apple Sign-In or Google Sign-In depending on your device." ],
                [ "q" => "Is my data secure?", "a" => "Yes. Your data is protected with encrypted authentication tokens and stored securely on the server." ],
                [ "q" => "Will my data sync across devices?", "a" => "Yes. As long as you sign in with the same Apple or Google account, your data syncs automatically." ],
                [ "q" => "If I import bills via CSV, are they encrypted immediately?", "a" => "To ensure maximum privacy, BillBell uses 'End-to-End Encryption.' This means the encryption key lives only on your device. When you upload a CSV, our server processes it to create the bills. Since our server does not have your private key, it cannot encrypt them initially. Once you edit and save an imported bill in the app, it will be automatically encrypted." ],
                [ "q" => "Why Can't I See My Bills Anymore (Decryption Failed)?", "a" => "This usually happens on a new device where the Family Encryption Key is not stored. If your new device's Public Key was not synchronized before the latest key was generated, the app cannot decrypt the data." ],
                [ "q" => "How to Fix Decryption Failure", "a" => "An Admin must go to Family Settings and select 'Rotate Family Encryption Key'. This re-encrypts the key for every member using their latest Public Key. Afterwards, relaunch the app." ]
            ]
        ],
        [
            "title" => "App Settings & Customization",
            "items" => [
                [ "q" => "Does the app support Dark Mode?", "a" => "Yes. The app automatically adapts to your device's appearance settings." ],
                [ "q" => "Can I change my reminder settings?", "a" => "Group admins can update default reminder times in Group Settings." ],
                [ "q" => "Can I change my Share ID?", "a" => "No. Share IDs are unique system-generated identifiers and cannot be changed." ]
            ]
        ],
        [
            "title" => "Billing & Amounts",
            "items" => [
                [ "q" => "How should I enter amounts?", "a" => "Enter the full amount without symbols. For example, '150.25' becomes $150.25." ],
                [ "q" => "Can I track auto-pay bills?", "a" => "Yes. You can mark debts as auto-pay when creating or editing them." ]
            ]
        ],
        [
            "title" => "Troubleshooting",
            "items" => [
                [ "q" => "My bills aren't updating on another device?", "a" => "Ensure both devices are logged into the same Group. Pull down on the Debts screen to refresh." ],
                [ "q" => "I accidentally deleted a debt. Can I restore it?", "a" => "No. Deleted debts cannot be recovered, so delete carefully." ]
            ]
        ]
    ];
    ?>
    <div class="container">
        <h1>Frequently Asked Questions</h1>
        <?php foreach ($faqSections as $section): ?>
            <div class="card">
                <h3 style="margin-top:0; border-bottom: 2px solid var(--mint); padding-bottom: 8px;">
                    <?php echo htmlspecialchars($section['title']); ?>
                </h3>
                <?php foreach ($section['items'] as $item): ?>
                    <div class="faq-q" onclick="t(this)"><?php echo htmlspecialchars($item['q']); ?> <span>+</span></div>
                    <div class="faq-a"><?php echo htmlspecialchars($item['a']); ?></div>
                <?php endforeach; ?>
            </div>
        <?php endforeach; ?>
    </div>
    <script>function t(e){let a=e.nextElementSibling; a.style.display=a.style.display==='block'?'none':'block'; e.querySelector('span').innerText=a.style.display==='block'?'-':'+';}</script>

<?php elseif ($page === 'privacy'): ?>
    <div class="container">
        <h1 style="color: var(--navy);">Privacy & Data Security</h1>
        
        <div class="card">
            <h3 style="color: var(--navy); border-bottom: 2px solid var(--mint); padding-bottom: 8px;">
                Zero-Knowledge Architecture
            </h3>
            <p>At BillBell, privacy is built into the first principles of our code. We utilize a <b>Zero-Knowledge</b> model, meaning your sensitive financial data is encrypted before it ever leaves your device.</p>
            <ul>
                <li><b>End-to-End Encryption (E2EE):</b> Your creditor name and notes are encrypted using AES-256 keys that reside only on your authorized devices.</li>
                <li><b>No Server Access:</b> Our servers act as a blind postman. We route your data to your family group, but we do not possess the keys to read it.</li>
                <li><b>Anonymized Authentication:</b> We use secure tokens from Apple and Google to verify your identity without storing your passwords.</li>
            </ul>
        </div>

        <div class="card">
            <h3 style="color: var(--navy); border-bottom: 2px solid var(--mint); padding-bottom: 8px;">
                Data Handling During Migration
            </h3>
            <p>When you join or leave a group, your data undergoes a secure transition process:</p>
            <ul>
                <li><b>Automatic Transfer:</b> Bills are reassigned to new Family IDs in the database, ensuring you never lose your history.</li>
                <li><b>Key Rotation:</b> To maintain security after membership changes, we provide a "Rotate Key" feature that re-secures the group with a fresh cryptographic foundation.</li>
            </ul>
        </div>

        <div class="card">
            <h3 style="color: var(--navy); border-bottom: 2px solid var(--mint); padding-bottom: 8px;">
                Information We Do NOT Collect
            </h3>
            <p>We do not sell, trade, or analyze your personal spending habits. Because we cannot decrypt your bills, we physically cannot build a profile of your financial life.</p>
        </div>

        <div style="height: 60px;"></div>
    </div>
    
<?php elseif ($page === 'support'): ?>
    <div class="container">
        <h1 style="color: var(--navy);">Support Center</h1>
        
        <div class="card">
            <div class="header-gradient" style="background: linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%); padding: 24px; color: #fff;">
                <h2 style="margin: 0; font-size: 20px;">Contact Technical Support</h2>
                <p style="margin: 4px 0 0; font-size: 13px; color: rgba(255,255,255,0.7);">Direct assistance for your BillBell account</p>
            </div>
            <div class="content" style="padding: 24px;">
                <form action="mailto:support@dunn-carabali.com" method="post" enctype="text/plain">
                    <label style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--subtext); margin-bottom: 6px;">Your Registered Email</label>
                    <input type="email" name="email" placeholder="email@example.com" required style="margin-bottom: 20px;" />

                    <label style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--subtext); margin-bottom: 6px;">Issue Category</label>
                    <select name="category" style="width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 12px; background: var(--bg); margin-bottom: 20px;">
                        <option value="login">Login / Authentication</option>
                        <option value="encryption">Decryption / Key Errors</option>
                        <option value="sync">Sync / Family Sharing</option>
                        <option value="billing">Bill Management</option>
                        <option value="other">Other Technical Issue</option>
                    </select>

                    <label style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--subtext); margin-bottom: 6px;">Description of Issue</label>
                    <textarea name="message" rows="5" placeholder="Please provide specific details..." required style="width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 12px; background: var(--bg); margin-bottom: 24px; font-family: inherit;"></textarea>

                    <button type="submit" style="width: 100%; padding: 16px; border: 0; border-radius: 16px; background: var(--navy); color: #fff; font-weight: 700; cursor: pointer;">
                        Send Support Request
                    </button>
                </form>
            </div>
        </div>

        <div class="card" style="margin-top: 24px;">
            <div class="content" style="padding: 24px;">
                <h3 style="margin-top: 0; color: var(--navy);">Common Resolutions</h3>
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div style="padding: 12px; border-left: 4px solid var(--mint); background: #f0fdf4; border-radius: 4px;">
                        <b style="font-size: 14px;">Decryption Failed?</b>
                        <p style="font-size: 13px; margin: 4px 0 0;">Ask your Family Admin to <b>Rotate the Family Key</b> in settings.</p>
                    </div>
                    <div style="padding: 12px; border-left: 4px solid var(--navy); background: #f1f5f9; border-radius: 4px;">
                        <b style="font-size: 14px;">Sync Issues?</b>
                        <p style="font-size: 13px; margin: 4px 0 0;">Pull down to refresh the Bills screen or verify your internet connection.</p>
                    </div>
                </div>
            </div>
        </div>

        <div style="text-align: center; margin-top: 32px; padding: 16px;">
            <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: #fff; border: 1px solid var(--border); border-radius: 20px;">
                <div style="width: 10px; height: 10px; background: #22c55e; border-radius: 50%;"></div>
                <span style="font-size: 12px; font-weight: 700; color: var(--subtext);">System Status: Operational</span>
            </div>
        </div>

        <div style="height: 60px;"></div>
    </div>
<?php elseif ($page === 'upload'): ?>
    <div class="container">
        <div class="card">
            <div class="content">
                <h3 id="prep_title" style="margin-top:0; color: var(--navy);">1. Preparation</h3>
                <a href="./bill_template.csv" class="template-link" style="display: inline-block; margin-bottom: 16px; color: var(--accent); font-weight: 700; text-decoration: none; padding: 8px 12px; background: #eff6ff; border-radius: 8px;">
                    📥 Download CSV Template
                </a>
                <p id="prep_sub" style="font-size: 13px; color: var(--subtext); margin-bottom: 12px;">
                    The file must use these headers exactly:
                </p>
                <table>
                    <thead>
                        <tr><th id="th_header">Header</th><th id="th_req">Required</th><th id="th_fmt">Format</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>name</td><td>Yes</td><td>Netflix</td></tr>
                        <tr><td>amount</td><td>Yes</td><td>15.99</td></tr>
                        <tr><td>due_date</td><td>Yes</td><td>YYYY-MM-DD</td></tr>
                        <tr><td>notes</td><td>No</td><td>Plan Details</td></tr>
                        <tr><td>recurrence</td><td>No</td><td>monthly, none...</td></tr>
                        <tr><td>payment_method</td><td>No</td><td>auto_pay, manual</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="card" style="margin-top: 24px;">
            <div class="header-gradient" style="background: linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%); padding: 24px; color: #fff;">
                <h2 id="upload_title" style="margin: 0; font-size: 20px; font-weight: 800;">2. Bulk Upload</h2>
                <p id="upload_sub" style="margin: 4px 0 0; font-size: 13px; color: rgba(255,255,255,0.7);">Securely sync bills to your account</p>
            </div>
            <div class="content" style="padding: 24px;">
                <form id="f">
                    <label id="lbl_share" style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--subtext); margin-bottom: 6px;">Family Share ID</label>
                    <input name="family_code" placeholder="Found in App" required style="margin-bottom: 20px;" />
                    
                    <label id="lbl_code" style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--subtext); margin-bottom: 6px;">Import Code</label>
                    <input name="import_code" placeholder="Generated in App" required style="margin-bottom: 20px;" />
                    
                    <label id="lbl_file" style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--subtext); margin-bottom: 6px;">File (CSV)</label>
                    <input name="file" type="file" accept=".csv" required style="margin-bottom: 24px;" />
                    
                    <button type="submit" id="btn" style="width: 100%; padding: 16px; border: 0; border-radius: 16px; background: var(--navy); color: #fff; font-weight: 700; cursor: pointer;">
                        Start Upload
                    </button>
                </form>
                
                <h3 id="res_title" style="font-size: 12px; color: var(--subtext); text-transform: uppercase; margin-top: 32px; margin-bottom: 12px;">Result</h3>
                <pre id="out" style="margin-bottom: 20px;">—</pre>
            </div>
        </div>
        
        <div style="height: 60px;"></div>
    </div>
            <script>
                document.getElementById("f").addEventListener("submit", async (e) => {
                    e.preventDefault();
                    const out = document.getElementById("out");
                    const fd = new FormData(e.target);
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                        try {
                            const lines = ev.target.result.split(/\r?\n/).filter(l => l.trim() !== "");
                            const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
                            const bills = lines.slice(1).map(l => {
                                const v = l.split(","); const b = {};
                                headers.forEach((h, i) => b[h] = v[i] ? v[i].trim() : "");
                                return b;
                            });
                            const res = await fetch("/billMVP/import/bills", {
                                method: "POST", headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ import_code: fd.get("import_code").toUpperCase(), bills })
                            });
                            out.textContent = JSON.stringify(await res.json(), null, 2);
                        } catch (err) { out.textContent = "Error: " + err.message; }
                    };
                    reader.readAsText(fd.get("file"));
                });
            </script>
        <?php endif; ?>
        <footer>
        <div class="container" style="padding: 0; margin: 0 auto;">
            &copy; <?php echo date("Y"); ?> BillBell a Dunn-Carabali, LLC Compamy, All rights reserved. 
            <br/>
            <small style="opacity: 0.7; font-weight: 400;">Logical Efficiency. Rigorous Privacy.</small>
        </div>
    </footer>
    </body>
    </html>
    <?php
    exit;
}

// 2. ---- API / CORS LOGIC ----
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = array_filter(array_map('trim', explode(',', getenv('ALLOWED_ORIGINS') ?: '')));
if ($origin && in_array($origin, $allowed, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin");
}
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=utf-8");
header("X-Content-Type-Options: nosniff");
header("Referrer-Policy: no-referrer");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204); exit;
}

// 3. ---- DISPATCH API ----
Routes::dispatch(); //
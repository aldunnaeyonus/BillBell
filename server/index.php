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
.lang-picker {
                padding: 6px 12px;
                border-radius: 10px;
                border: 1px solid var(--border);
                background: var(--bg);
                font-weight: 600;
                cursor: pointer;
                width: auto;
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
            input, textarea, select { width: 100%; box-sizing: border-box; padding: 12px; margin-top: 6px; border: 1px solid var(--border); border-radius: 12px; background: var(--bg); }
            pre { background: #f1f5f9; padding: 16px; border-radius: 12px; font-size: 13px; border: 1px dashed var(--border); overflow-x: auto; }

            /* ---- MOBILE / RESPONSIVE STYLES ---- */
            @media (max-width: 768px) {
                body { padding-top: 0; }
                header { position: relative; height: auto; flex-direction: column; gap: 15px; padding: 20px; }
                nav { display: flex; flex-direction: column; width: 100%; text-align: center; }
                nav a { margin-left: 0; display: block; padding: 12px 0; border-bottom: 1px solid var(--border); }
                .lang-picker { width: 100%; margin-top: 10px; width: auto;}
            }
        </style>
    </head>
    <body>
        <header>
            <a href="?page=home" class="logo-container">
                <img src="./favicon.png" alt="Logo" class="logo-img" />
                <span class="logo-text">BillBell</span>
            </a>
            <nav>
                <a href="?page=home" id="nav_home">Home</a>
                <a href="?page=about" id="nav_about">About</a>
                <a href="?page=faq" id="nav_faq">FAQ</a>
                <a href="?page=upload" id="nav_upload">Bulk Upload</a>
                <a href="?page=support" id="nav_support">Support</a>
                <a href="?page=privacy" id="nav_privacy">Privacy & Data</a>
            </nav>
            <select class="lang-picker" id="langPicker">
            <option value="en">EN</option>
            <option value="es">ES</option>
            <option value="de">DE</option>
            <option value="fr">FR</option>
            <option value="it">IT</option>
            <option value="nl">NL</option>
            <option value="pt-BR">PT</option>
            <option value="ja">JP</option>
            <option value="zh-Hans">CN</option>
            </select>
        </header>

<?php if ($page === 'home'): ?>
    <div class="hero" style="background: linear-gradient(180deg, var(--navy) 0%, #2c3e50 100%); color: white; padding: 60px 20px; text-align: center;">
        <div class="container" style="max-width: 900px; margin: 0 auto;">
            
            <h1 id="hero_title" style="font-size: 3rem; margin-bottom: 10px;">Join the Family</h1>
            <p id="hero_sub" style="font-size: 1.2rem; opacity: 0.9; margin-bottom: 30px;">Sync bills seamlessly across devices.</p>

            <?php if ($code): ?>
                <div style="background: rgba(255,255,255,0.15); padding: 20px 40px; border-radius: 16px; display: inline-block; margin-bottom: 30px; border: 2px dashed rgba(255,255,255,0.3); backdrop-filter: blur(5px);">
                    <small id="invite_label" style="text-transform:uppercase; font-weight:700; letter-spacing: 1px; opacity: 0.8;">Your Invite Code</small><br/>
                    <b style="font-size: 36px; letter-spacing: 4px; color: var(--mint);"><?= htmlspecialchars($code) ?></b>
                </div><br/>
            <?php endif; ?>

            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-bottom: 40px;">
                <a href="<?= $androidStore ?>" style="transition: transform 0.2s;">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" height="50">
                </a>
                <a href="<?= $iosStore ?>" style="transition: transform 0.2s;">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on the App Store" height="50">
                </a>
            </div>

<div style="margin-top: 20px; text-align: center;">
    <img 
        id="hero_img" 
        src="./img/en.png" 
        alt="App Screenshot" 
        style="border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); border: 4px solid #333; width: auto; max-width: 100%; max-height: 500px;"
    >
</div>
        </div>
    </div>

    <div class="container" style="padding: 60px 20px; max-width: 900px; margin: 0 auto;">
        <h2 id="why_title" style="text-align: center; color: var(--navy); margin-bottom: 40px;">Why BillBell?</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px;">
            
            <div class="card" style="background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
                <div style="font-size: 40px; margin-bottom: 15px;">🔒</div>
                <h3 id="card_priv_t" style="color: var(--navy);">Total Privacy</h3>
                <p id="card_priv_d" style="color: #666;">Zero-Knowledge encryption means we can't see your data even if we wanted to.</p>
            </div>

            <div class="card" style="background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
                <div style="font-size: 40px; margin-bottom: 15px;">👨‍👩‍👧‍👦</div>
                <h3 id="card_sync_t" style="color: var(--navy);">Family Sync</h3>
                <p id="card_sync_d" style="color: #666;">Changes update instantly across all family members' devices.</p>
            </div>

            <div class="card" style="background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
                <div style="font-size: 40px; margin-bottom: 15px;">🔔</div>
                <h3 id="card_alert_t" style="color: var(--navy);">Smart Alerts</h3>
                <p id="card_alert_d" style="color: #666;">Get reminded before bills are due, so you never pay a late fee again.</p>
            </div>

        </div>
        <div style="height: 60px;"></div>
    </div>

<?php elseif ($page === 'about'): ?>
    <div class="container">
        <h1 id="about_title">Our Philosophy</h1>
        
        <div class="card">
            <h3 id="about_t1" style="color: var(--navy); border-bottom: 2px solid var(--mint); padding-bottom: 8px;">First-Principle Thinking</h3>
            <div id="about_d1">
                <p>BillBell was not built to be another cluttered "fintech" app. It was built by stripping the problem of shared debt down to its fundamental truths.</p>
                <ul>
                    <li><b>Truth 1:</b> Shared bills require absolute transparency between members.</li>
                    <li><b>Truth 2:</b> Privacy is non-negotiable; data must be encrypted at the source.</li>
                    <li><b>Truth 3:</b> Friction kills consistency. Managing money should be as fast as a tap.</li>
                </ul>
            </div>
        </div>

        <div class="card">
            <h3 id="about_t2" style="color: var(--navy); border-bottom: 2px solid var(--mint); padding-bottom: 8px;">Results Over Pleasantries</h3>
            <p id="about_d2">We value logic and effectiveness over flattery. Our interface is designed for low-friction communication. We provide the data you need to stay on top of your obligations, formatted for quick scanning and immediate action.</p>
        </div>

        <div class="card">
            <h3 id="about_t3" style="color: var(--navy); border-bottom: 2px solid var(--mint); padding-bottom: 8px;">Rigorous Security</h3>
            <div id="about_d3">
                <p>BillBell utilizes a decentralized encryption model. When you join a family, your bills are migrated to a new shared ID, but they remain protected by keys held only by your group.</p>
                <p>Because your encryption key lives only on your device, we cannot see your bills, and neither can anyone else outside your trusted circle.</p>
            </div>
        </div>

        <div class="card" style="text-align: center; background: var(--navy); color: white;">
            <h3 id="about_cta_t" style="color: var(--mint);">Ready for Clarity?</h3>
            <p id="about_cta_d" style="color: white; opacity: 0.9;">Stop guessing. Start tracking with logic.</p>
            <a href="?page=home" id="about_btn" class="btn btn-mint">Back to Join</a>
        </div>
    </div>

<?php elseif ($page === 'faq'): 
    // Note: To fully internationalize the FAQ questions, this array would need to be replaced by a JS-based rendering system. 
    // For now, we are translating the Static Headers only.
    $faqSections = [
        [ "title" => "Adding & Managing Debts", "items" => [ [ "q" => "How do I add a debt?", "a" => "Go to the Debts screen and tap the '+ Add' button." ], [ "q" => "How do I delete a debt?", "a" => "Select a debt, then tap the 'Delete' button." ] ] ],
        [ "title" => "Notifications & Reminders", "items" => [ [ "q" => "When will I receive reminders?", "a" => "The day before a debt is due." ] ] ],
        [ "title" => "Families & Sharing", "items" => [ [ "q" => "Can I share my account?", "a" => "Yes. Share your Share ID." ] ] ]
    ];
    ?>
    <div class="container">
        <h1 id="faq_main_title">Frequently Asked Questions</h1>
        <p style="color:var(--subtext); font-size:12px; margin-top:-10px;" id="faq_note">Note: FAQ content is currently available in English only.</p>
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
        <h1 id="priv_title" style="color: var(--navy);">Privacy & Data Security</h1>
        
        <div class="card">
            <h3 id="priv_t1" style="color: var(--navy); border-bottom: 2px solid var(--mint); padding-bottom: 8px;">Zero-Knowledge Architecture</h3>
            <div id="priv_d1">
                <p>At BillBell, privacy is built into the first principles of our code. We utilize a <b>Zero-Knowledge</b> model, meaning your sensitive financial data is encrypted before it ever leaves your device.</p>
                <ul>
                    <li><b>End-to-End Encryption (E2EE):</b> Your creditor name and notes are encrypted using AES-256 keys.</li>
                    <li><b>No Server Access:</b> Our servers act as a blind postman.</li>
                    <li><b>Anonymized Authentication:</b> We use secure tokens from Apple and Google.</li>
                </ul>
            </div>
        </div>

        <div class="card">
            <h3 id="priv_t2" style="color: var(--navy); border-bottom: 2px solid var(--mint); padding-bottom: 8px;">Google User Data</h3>
            <div id="priv_d2">
                <p>In compliance with the Google API Services User Data Policy, we are transparent about how we handle information:</p>
                <h4 style="color: var(--navy); margin-top: 15px;">Data Accessed</h4>
                <ul><li><b>Identity Information:</b> We access your Google email address for authentication only.</li></ul>
                <h4 style="color: var(--navy); margin-top: 15px;">Data Usage</h4>
                <ul>
                    <li><b>Authentication:</b> Verify your identity.</li>
                    <li><b>Service Functionality:</b> Link you to your Family Group.</li>
                    <li><b>No External Sharing:</b> We do not share data with third parties or AI models.</li>
                </ul>
            </div>
        </div>

        <div class="card">
            <h3 id="priv_t3" style="color: var(--navy); border-bottom: 2px solid var(--mint); padding-bottom: 8px;">Information We Do NOT Collect</h3>
            <p id="priv_d3">We do not sell, trade, or analyze your personal spending habits. Because we cannot decrypt your bills, we physically cannot build a profile of your financial life.</p>
        </div>
        <div style="height: 60px;"></div>
    </div>
    
<?php elseif ($page === 'support'): ?>
    <div class="container">
        <h1 id="supp_title" style="color: var(--navy);">Support Center</h1>
        
        <div class="card">
            <div class="header-gradient" style="background: linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%); padding: 24px; color: #fff;">
                <h2 id="supp_h1" style="margin: 0; font-size: 20px;">Contact Technical Support</h2>
                <p id="supp_sub" style="margin: 4px 0 0; font-size: 13px; color: rgba(255,255,255,0.7);">Direct assistance for your BillBell account</p>
            </div>
            <div class="content" style="padding: 24px;">
                <form action="mailto:support@dunn-carabali.com" method="post" enctype="text/plain">
                    <label id="lbl_email" style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--subtext); margin-bottom: 6px;">Your Registered Email</label>
                    <input type="email" name="email" placeholder="email@example.com" required style="margin-bottom: 20px;" />

                    <label id="lbl_cat" style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--subtext); margin-bottom: 6px;">Issue Category</label>
                    <select name="category" style="width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 12px; background: var(--bg); margin-bottom: 20px;">
                        <option value="login">Login / Authentication</option>
                        <option value="encryption">Decryption / Key Errors</option>
                        <option value="sync">Sync / Family Sharing</option>
                        <option value="billing">Bill Management</option>
                        <option value="other">Other Technical Issue</option>
                    </select>

                    <label id="lbl_desc" style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--subtext); margin-bottom: 6px;">Description of Issue</label>
                    <textarea name="message" rows="5" placeholder="..." required style="width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 12px; background: var(--bg); margin-bottom: 24px; font-family: inherit;"></textarea>

                    <button id="btn_send" type="submit" style="width: 100%; padding: 16px; border: 0; border-radius: 16px; background: var(--navy); color: #fff; font-weight: 700; cursor: pointer;">
                        Send Support Request
                    </button>
                </form>
            </div>
        </div>

        <div class="card" style="margin-top: 24px;">
            <div class="content" style="padding: 24px;">
                <h3 id="supp_res_t" style="margin-top: 0; color: var(--navy);">Common Resolutions</h3>
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div style="padding: 12px; border-left: 4px solid var(--mint); background: #f0fdf4; border-radius: 4px;">
                        <b id="res_1_t" style="font-size: 14px;">Decryption Failed?</b>
                        <p id="res_1_d" style="font-size: 13px; margin: 4px 0 0;">Ask your Family Admin to <b>Rotate the Family Key</b> in settings.</p>
                    </div>
                    <div style="padding: 12px; border-left: 4px solid var(--navy); background: #f1f5f9; border-radius: 4px;">
                        <b id="res_2_t" style="font-size: 14px;">Sync Issues?</b>
                        <p id="res_2_d" style="font-size: 13px; margin: 4px 0 0;">Pull down to refresh the Bills screen or verify your internet connection.</p>
                    </div>
                </div>
            </div>
        </div>
        <div style="text-align: center; margin-top: 32px; padding: 16px;">
            <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: #fff; border: 1px solid var(--border); border-radius: 20px;">
                <div style="width: 10px; height: 10px; background: #22c55e; border-radius: 50%;"></div>
                <span id="sys_stat" style="font-size: 12px; font-weight: 700; color: var(--subtext);">System Status: Operational</span>
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
                    📥 <span id="download_txt">Download CSV Template</span>
                </a>
                <p id="prep_sub" style="font-size: 13px; color: var(--subtext); margin-bottom: 12px;">The file must use these headers exactly:</p>
                <table>
                    <thead><tr><th id="th_header">Header</th><th id="th_req">Required</th><th id="th_fmt">Format</th></tr></thead>
                    <tbody>
                        <tr><td>name</td><td>Yes</td><td>Netflix</td></tr>
                        <tr><td>amount</td><td>Yes</td><td>15.99</td></tr>
                        <tr><td>due_date</td><td>Yes</td><td>YYYY-MM-DD, </td></tr>
                        <tr><td>notes</td><td>No</td><td>Plan Details</td></tr>
                        <tr><td>recurrence</td><td>yes</td><td>none, weekly, bi-weekly, bi-monthly, monthly, semi-monthly, quarterly, annualy, semi-annualy</td></tr>
                        <tr><td>payment_method</td><td>No</td><td>auto, manual</td></tr>

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
                    
                    <button type="submit" id="btn" style="width: 100%; padding: 16px; border: 0; border-radius: 16px; background: var(--navy); color: #fff; font-weight: 700; cursor: pointer;">Start Upload</button>
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
    out.textContent = "Uploading...";
    
    const fd = new FormData(e.target);
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
        try {
            // Parse CSV
            const lines = ev.target.result.split(/\r?\n/).filter(l => l.trim() !== "");
            const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
            const bills = lines.slice(1).map(l => {
                const v = l.split(","); const b = {};
                headers.forEach((h, i) => b[h] = v[i] ? v[i].trim() : "");
                return b;
            });

            // Send Request
            const res = await fetch("/billMVP/import/bills", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    family_code: fd.get("family_code"), // Sending Share ID
                    import_code: fd.get("import_code").toUpperCase(), 
                    bills 
                })
            });

            // Handle Response
            const text = await res.text(); // Get text first to debug empty responses
            try {
                const json = JSON.parse(text);
                out.textContent = JSON.stringify(json, null, 2);
            } catch (jsonErr) {
                out.textContent = "Server Error (Not JSON): " + text;
            }

        } catch (err) { 
            out.textContent = "Client Error: " + err.message; 
        }
    };
    reader.readAsText(fd.get("file"));
});
</script>
    <?php endif; ?>
    <footer>
    <div class="container" style="padding: 0; margin: 0 auto;">
        <span id="foot_copy">&copy; <?php echo date("Y"); ?> BillBell a Dunn-Carabali, LLC Company, All rights reserved.</span>
        <br/>
        <small id="foot_slogan" style="opacity: 0.7; font-weight: 400;">Logical Efficiency. Rigorous Privacy.</small>
    </div>
</footer>
<script>
  const translations = {
    en: {
        nav_home: "Home", nav_about: "About", nav_faq: "FAQ", nav_upload: "Bulk Upload", nav_support: "Support", nav_privacy: "Privacy & Data",
        hero_title: "Join the Family", hero_sub: "Sync bills seamlessly across devices.", invite_label: "Your Invite Code",
        why_title: "Why BillBell?",
        card_priv_t: "Total Privacy", card_priv_d: "Zero-Knowledge encryption means we can't see your data even if we wanted to.",
        card_sync_t: "Family Sync", card_sync_d: "Changes update instantly across all family members' devices.",
        card_alert_t: "Smart Alerts", card_alert_d: "Get reminded before bills are due, so you never pay a late fee again.",
        about_title: "Our Philosophy",
        about_t1: "First-Principle Thinking",
        about_d1: "<p>BillBell was not built to be another cluttered 'fintech' app. It was built by stripping the problem of shared debt down to its fundamental truths.</p><ul><li><b>Truth 1:</b> Shared bills require absolute transparency between members.</li><li><b>Truth 2:</b> Privacy is non-negotiable; data must be encrypted at the source.</li><li><b>Truth 3:</b> Friction kills consistency. Managing money should be as fast as a tap.</li></ul>",
        about_t2: "Results Over Pleasantries",
        about_d2: "We value logic and effectiveness over flattery. Our interface is designed for low-friction communication. We provide the data you need to stay on top of your obligations, formatted for quick scanning and immediate action.",
        about_t3: "Rigorous Security",
        about_d3: "<p>BillBell utilizes a decentralized encryption model. When you join a family, your bills are migrated to a new shared ID, but they remain protected by keys held only by your group.</p><p>Because your encryption key lives only on your device, we cannot see your bills, and neither can anyone else outside your trusted circle.</p>",
        about_cta_t: "Ready for Clarity?", about_cta_d: "Stop guessing. Start tracking with logic.", about_btn: "Back to Join",
        faq_main_title: "Frequently Asked Questions", faq_note: "Note: FAQ content is currently available in English only.",
        priv_title: "Privacy & Data Security",
        priv_t1: "Zero-Knowledge Architecture",
        priv_d1: "<p>At BillBell, privacy is built into the first principles of our code. We utilize a <b>Zero-Knowledge</b> model, meaning your sensitive financial data is encrypted before it ever leaves your device.</p><ul><li><b>End-to-End Encryption (E2EE):</b> Your creditor name and notes are encrypted using AES-256 keys that reside only on your authorized devices.</li><li><b>No Server Access:</b> Our servers act as a blind postman. We route your data to your family group, but we do not possess the keys to read it.</li><li><b>Anonymized Authentication:</b> We use secure tokens from Apple and Google to verify your identity without storing your passwords.</li></ul>",
        priv_t2: "Google User Data",
        priv_d2: "<p>In compliance with the Google API Services User Data Policy, we are transparent about how we handle information:</p><h4 style='color: var(--navy); margin-top: 15px;'>Data Accessed</h4><ul><li><b>Identity Information:</b> We access your Google email address and basic profile information (such as your name/ID) solely for authentication purposes.</li></ul><h4 style='color: var(--navy); margin-top: 15px;'>Data Usage</h4><ul><li><b>Authentication & Account Creation:</b> Your Google credentials are used to verify your identity and create your unique user account within our system.</li><li><b>Service Functionality:</b> We use your email to link you to your specific Family Group and to ensure you only access data belonging to you.</li><li><b>No External Sharing:</b> We do not share your Google user data with third-party tools, AI models, or advertising networks.</li></ul>",
        priv_t3: "Information We Do NOT Collect",
        priv_d3: "We do not sell, trade, or analyze your personal spending habits. Because we cannot decrypt your bills, we physically cannot build a profile of your financial life.",
        supp_title: "Support Center", supp_h1: "Contact Technical Support", supp_sub: "Direct assistance for your BillBell account",
        lbl_email: "Your Registered Email", lbl_cat: "Issue Category", lbl_desc: "Description of Issue", btn_send: "Send Support Request",
        supp_res_t: "Common Resolutions", res_1_t: "Decryption Failed?", res_1_d: "Ask your Family Admin to <b>Rotate the Family Key</b> in settings.",
        res_2_t: "Sync Issues?", res_2_d: "Pull down to refresh the Bills screen or verify your internet connection.",
        sys_stat: "System Status: Operational",
        prep_title: "1. Preparation", download_txt: "Download CSV Template", prep_sub: "The file must use these headers exactly:", th_header: "Header", th_req: "Required", th_fmt: "Format",
        upload_title: "2. Bulk Upload", upload_sub: "Securely sync bills to your account", lbl_share: "Family Share ID", lbl_code: "Import Code", lbl_file: "File (CSV)", btn: "Start Upload", res_title: "Result",
        foot_copy: "&copy; " + new Date().getFullYear() + " BillBell a Dunn-Carabali, LLC Company, All rights reserved.", foot_slogan: "Logical Efficiency. Rigorous Privacy."
    },
    es: {
        nav_home: "Inicio", nav_about: "Acerca de", nav_faq: "FAQ", nav_upload: "Carga Masiva", nav_support: "Soporte", nav_privacy: "Privacidad",
        hero_title: "Únete a la Familia", hero_sub: "Sincroniza facturas sin problemas en todos los dispositivos.", invite_label: "Tu Código de Invitación",
        why_title: "¿Por qué BillBell?",
        card_priv_t: "Privacidad Total", card_priv_d: "El cifrado de Conocimiento Cero significa que no podemos ver tus datos aunque quisiéramos.",
        card_sync_t: "Sincronización Familiar", card_sync_d: "Los cambios se actualizan instantáneamente en los dispositivos de todos los miembros.",
        card_alert_t: "Alertas Inteligentes", card_alert_d: "Recibe recordatorios antes del vencimiento para no pagar multas nunca más.",
        about_title: "Nuestra Filosofía",
        about_t1: "Pensamiento de Primeros Principios",
        about_d1: "<p>BillBell no se construyó para ser otra aplicación 'fintech' desordenada. Se construyó desglosando el problema de la deuda compartida hasta sus verdades fundamentales.</p><ul><li><b>Verdad 1:</b> Las facturas compartidas requieren transparencia absoluta.</li><li><b>Verdad 2:</b> La privacidad no es negociable; los datos deben cifrarse en la fuente.</li><li><b>Verdad 3:</b> La fricción mata la consistencia. Gestionar el dinero debe ser rápido.</li></ul>",
        about_t2: "Resultados sobre Cortesías",
        about_d2: "Valoramos la lógica y la efectividad sobre los halagos. Nuestra interfaz está diseñada para una comunicación de baja fricción.",
        about_t3: "Seguridad Rigurosa",
        about_d3: "<p>BillBell utiliza un modelo de cifrado descentralizado. Solo tu grupo tiene las llaves.</p>",
        about_cta_t: "¿Listo para la Claridad?", about_cta_d: "Deja de adivinar. Empieza a rastrear con lógica.", about_btn: "Volver a Unirse",
        faq_main_title: "Preguntas Frecuentes", faq_note: "Nota: El contenido de las preguntas frecuentes está disponible solo en inglés.",
        priv_title: "Privacidad y Seguridad de Datos",
        priv_t1: "Arquitectura de Conocimiento Cero",
        priv_d1: "<p>En BillBell, la privacidad es fundamental. Utilizamos un modelo de <b>Conocimiento Cero</b>.</p><ul><li><b>Cifrado de Extremo a Extremo:</b> Tus datos se cifran con claves AES-256.</li><li><b>Sin Acceso al Servidor:</b> Nuestros servidores son solo intermediarios ciegos.</li></ul>",
        priv_t2: "Datos de Usuario de Google",
        priv_d2: "<p>Cumplimos con la Política de Datos de Usuario de Google:</p><ul><li><b>Autenticación:</b> Usamos tu correo para verificar tu identidad.</li><li><b>Sin Compartir:</b> No compartimos datos con terceros o modelos de IA.</li></ul>",
        priv_t3: "Información que NO Recopilamos",
        priv_d3: "No vendemos ni analizamos tus hábitos de gasto. No podemos descifrar tus facturas.",
        supp_title: "Centro de Soporte", supp_h1: "Contactar Soporte Técnico", supp_sub: "Asistencia directa para tu cuenta BillBell",
        lbl_email: "Tu Correo Registrado", lbl_cat: "Categoría del Problema", lbl_desc: "Descripción del Problema", btn_send: "Enviar Solicitud",
        supp_res_t: "Resoluciones Comunes", res_1_t: "¿Falló el Descifrado?", res_1_d: "Pide a tu Admin que rote la Clave Familiar.",
        res_2_t: "¿Problemas de Sincronización?", res_2_d: "Desliza hacia abajo para actualizar la pantalla de Facturas.",
        sys_stat: "Estado del Sistema: Operativo",
        prep_title: "1. Preparación", download_txt: "Descargar Plantilla CSV", prep_sub: "El archivo debe usar estos encabezados:", th_header: "Encabezado", th_req: "Requerido", th_fmt: "Formato",
        upload_title: "2. Carga Masiva", upload_sub: "Sincroniza facturas de forma segura", lbl_share: "ID de Compartir Familiar", lbl_code: "Código de Importación", lbl_file: "Archivo (CSV)", btn: "Iniciar Carga", res_title: "Resultado",
        foot_copy: "&copy; " + new Date().getFullYear() + " BillBell, una empresa de Dunn-Carabali, LLC. Todos los derechos reservados.", foot_slogan: "Eficiencia Lógica. Privacidad Rigurosa."
    },
    de: {
        nav_home: "Startseite", nav_about: "Über uns", nav_faq: "FAQ", nav_upload: "Massen-Upload", nav_support: "Support", nav_privacy: "Datenschutz",
        hero_title: "Treten Sie der Familie bei", hero_sub: "Rechnungen nahtlos über Geräte hinweg synchronisieren.", invite_label: "Ihr Einladungscode",
        why_title: "Warum BillBell?",
        card_priv_t: "Totale Privatsphäre", card_priv_d: "Zero-Knowledge-Verschlüsselung bedeutet, dass wir Ihre Daten nicht sehen können.",
        card_sync_t: "Familiensynchronisation", card_sync_d: "Änderungen werden sofort auf allen Geräten aktualisiert.",
        card_alert_t: "Smarte Alarme", card_alert_d: "Erhalten Sie Erinnerungen, bevor Rechnungen fällig sind.",
        about_title: "Unsere Philosophie",
        about_t1: "Denken nach ersten Prinzipien",
        about_d1: "<p>BillBell wurde entwickelt, indem das Problem der gemeinsamen Schulden auf seine fundamentalen Wahrheiten reduziert wurde.</p><ul><li><b>Wahrheit 1:</b> Gemeinsame Rechnungen erfordern Transparenz.</li><li><b>Wahrheit 2:</b> Privatsphäre ist nicht verhandelbar.</li></ul>",
        about_t2: "Ergebnisse vor Höflichkeiten",
        about_d2: "Wir schätzen Logik und Effektivität mehr als Schmeichelei.",
        about_t3: "Strenge Sicherheit",
        about_d3: "<p>BillBell verwendet ein dezentrales Verschlüsselungsmodell.</p>",
        about_cta_t: "Bereit für Klarheit?", about_cta_d: "Hören Sie auf zu raten. Verfolgen Sie mit Logik.", about_btn: "Zurück zum Beitritt",
        faq_main_title: "Häufig gestellte Fragen", faq_note: "Hinweis: FAQ-Inhalte sind derzeit nur auf Englisch verfügbar.",
        priv_title: "Datenschutz & Sicherheit",
        priv_t1: "Zero-Knowledge-Architektur",
        priv_d1: "<p>Wir verwenden ein <b>Zero-Knowledge</b>-Modell. Ihre Daten werden verschlüsselt, bevor sie Ihr Gerät verlassen.</p>",
        priv_t2: "Google-Benutzerdaten",
        priv_d2: "<p>Wir verwenden Ihre Google-Daten nur zur Authentifizierung und teilen sie nicht mit Dritten.</p>",
        priv_t3: "Informationen, die wir NICHT sammeln",
        priv_d3: "Wir verkaufen oder analysieren Ihre Ausgabengewohnheiten nicht.",
        supp_title: "Support-Center", supp_h1: "Technischen Support kontaktieren", supp_sub: "Direkte Unterstützung für Ihr Konto",
        lbl_email: "Ihre registrierte E-Mail", lbl_cat: "Problemkategorie", lbl_desc: "Problembeschreibung", btn_send: "Anfrage senden",
        supp_res_t: "Häufige Lösungen", res_1_t: "Entschlüsselung fehlgeschlagen?", res_1_d: "Bitten Sie den Admin, den Familienschlüssel zu rotieren.",
        res_2_t: "Synchronisierungsprobleme?", res_2_d: "Ziehen Sie nach unten, um zu aktualisieren.",
        sys_stat: "Systemstatus: Betriebsbereit",
        prep_title: "1. Vorbereitung", download_txt: "CSV-Vorlage herunterladen", prep_sub: "Die Datei muss diese Kopfzeilen verwenden:", th_header: "Kopfzeile", th_req: "Erforderlich", th_fmt: "Format",
        upload_title: "2. Massen-Upload", upload_sub: "Rechnungen sicher synchronisieren", lbl_share: "Familien-Share-ID", lbl_code: "Import-Code", lbl_file: "Datei (CSV)", btn: "Upload Starten", res_title: "Ergebnis",
        foot_copy: "&copy; " + new Date().getFullYear() + " BillBell, alle Rechte vorbehalten.", foot_slogan: "Logische Effizienz. Strenge Privatsphäre."
    },
    fr: {
        nav_home: "Accueil", nav_about: "À propos", nav_faq: "FAQ", nav_upload: "Import de masse", nav_support: "Support", nav_privacy: "Confidentialité",
        hero_title: "Rejoignez la famille", hero_sub: "Synchronisez vos factures sur tous vos appareils.", invite_label: "Votre code d'invitation",
        why_title: "Pourquoi BillBell ?",
        card_priv_t: "Confidentialité Totale", card_priv_d: "Le chiffrement Zero-Knowledge signifie que nous ne pouvons pas voir vos données.",
        card_sync_t: "Synchro Familiale", card_sync_d: "Les modifications sont mises à jour instantanément partout.",
        card_alert_t: "Alertes Intelligentes", card_alert_d: "Soyez rappelé avant l'échéance des factures.",
        about_title: "Notre Philosophie",
        about_t1: "Pensée par Premiers Principes",
        about_d1: "<p>BillBell a été construit en réduisant le problème de la dette partagée à ses vérités fondamentales.</p>",
        about_t2: "Résultats avant tout",
        about_d2: "Nous privilégions la logique et l'efficacité.",
        about_t3: "Sécurité Rigoureuse",
        about_d3: "<p>BillBell utilise un modèle de chiffrement décentralisé.</p>",
        about_cta_t: "Prêt pour la clarté ?", about_cta_d: "Arrêtez de deviner. Commencez à suivre.", about_btn: "Retour",
        faq_main_title: "Foire Aux Questions", faq_note: "Remarque : Le contenu de la FAQ est disponible uniquement en anglais.",
        priv_title: "Confidentialité et Sécurité",
        priv_t1: "Architecture Zero-Knowledge",
        priv_d1: "<p>Vos données financières sensibles sont chiffrées avant de quitter votre appareil.</p>",
        priv_t2: "Données Google",
        priv_d2: "<p>Nous utilisons vos données Google uniquement pour l'authentification.</p>",
        priv_t3: "Ce que nous ne collectons PAS",
        priv_d3: "Nous ne vendons ni n'analysons vos habitudes de dépenses.",
        supp_title: "Centre de Support", supp_h1: "Contacter le Support", supp_sub: "Assistance directe pour votre compte",
        lbl_email: "Votre Email", lbl_cat: "Catégorie", lbl_desc: "Description", btn_send: "Envoyer",
        supp_res_t: "Solutions courantes", res_1_t: "Échec du déchiffrement ?", res_1_d: "Demandez à l'admin de tourner la clé familiale.",
        res_2_t: "Problèmes de synchro ?", res_2_d: "Tirez vers le bas pour rafraîchir.",
        sys_stat: "État du système : Opérationnel",
        prep_title: "1. Préparation", download_txt: "Télécharger le modèle CSV", prep_sub: "Le fichier doit utiliser ces en-têtes :", th_header: "En-tête", th_req: "Requis", th_fmt: "Format",
        upload_title: "2. Import de Masse", upload_sub: "Synchronisez vos factures", lbl_share: "ID de Partage", lbl_code: "Code d'Import", lbl_file: "Fichier (CSV)", btn: "Démarrer", res_title: "Résultat",
        foot_copy: "&copy; " + new Date().getFullYear() + " BillBell, tous droits réservés.", foot_slogan: "Efficacité Logique. Confidentialité Rigoureuse."
    },
    it: {
        nav_home: "Home", nav_about: "Chi siamo", nav_faq: "FAQ", nav_upload: "Caricamento", nav_support: "Supporto", nav_privacy: "Privacy",
        hero_title: "Unisciti alla Famiglia", hero_sub: "Sincronizza le bollette su tutti i dispositivi.", invite_label: "Tuo Codice Invito",
        why_title: "Perché BillBell?",
        card_priv_t: "Privacy Totale", card_priv_d: "Crittografia Zero-Knowledge significa che non possiamo vedere i tuoi dati.",
        card_sync_t: "Sincronizzazione", card_sync_d: "Le modifiche si aggiornano istantaneamente.",
        card_alert_t: "Avvisi Intelligenti", card_alert_d: "Ricevi promemoria prima della scadenza.",
        about_title: "La Nostra Filosofia",
        about_t1: "Pensiero dai Primi Principi",
        about_d1: "<p>BillBell è stato costruito riducendo il problema del debito condiviso alle sue verità fondamentali.</p>",
        about_t2: "Risultati Sopra i Convenevoli",
        about_d2: "Apprezziamo la logica e l'efficacia.",
        about_t3: "Sicurezza Rigorosa",
        about_d3: "<p>BillBell utilizza un modello di crittografia decentralizzato.</p>",
        about_cta_t: "Pronto per la Chiarezza?", about_cta_d: "Smetti di indovinare. Traccia con logica.", about_btn: "Torna indietro",
        faq_main_title: "Domande Frequenti", faq_note: "Nota: Le FAQ sono disponibili solo in inglese.",
        priv_title: "Privacy e Sicurezza",
        priv_t1: "Architettura Zero-Knowledge",
        priv_d1: "<p>I tuoi dati sono crittografati prima di lasciare il dispositivo.</p>",
        priv_t2: "Dati Utente Google",
        priv_d2: "<p>Utilizziamo i tuoi dati Google solo per l'autenticazione.</p>",
        priv_t3: "Info che NON raccogliamo",
        priv_d3: "Non vendiamo né analizziamo le tue abitudini di spesa.",
        supp_title: "Centro Supporto", supp_h1: "Contatta Supporto", supp_sub: "Assistenza diretta",
        lbl_email: "Tua Email", lbl_cat: "Categoria", lbl_desc: "Descrizione", btn_send: "Invia",
        supp_res_t: "Risoluzioni Comuni", res_1_t: "Decrittazione fallita?", res_1_d: "Chiedi all'admin di ruotare la chiave.",
        res_2_t: "Problemi Sync?", res_2_d: "Trascina giù per aggiornare.",
        sys_stat: "Stato Sistema: Operativo",
        prep_title: "1. Preparazione", download_txt: "Scarica Modello CSV", prep_sub: "Intestazioni richieste:", th_header: "Intestazione", th_req: "Richiesto", th_fmt: "Formato",
        upload_title: "2. Caricamento", upload_sub: "Sincronizza in sicurezza", lbl_share: "ID Condivisione", lbl_code: "Codice Import", lbl_file: "File (CSV)", btn: "Inizia", res_title: "Risultato",
        foot_copy: "&copy; " + new Date().getFullYear() + " BillBell, tutti i diritti riservati.", foot_slogan: "Efficienza Logica. Privacy Rigorosa."
    },
    nl: {
        nav_home: "Home", nav_about: "Over ons", nav_faq: "FAQ", nav_upload: "Bulk Upload", nav_support: "Support", nav_privacy: "Privacy",
        hero_title: "Word lid van de familie", hero_sub: "Synchroniseer rekeningen naadloos.", invite_label: "Uw Uitnodigingscode",
        why_title: "Waarom BillBell?",
        card_priv_t: "Totale Privacy", card_priv_d: "Zero-Knowledge encryptie betekent dat wij uw gegevens niet zien.",
        card_sync_t: "Gezinssynchronisatie", card_sync_d: "Wijzigingen worden direct bijgewerkt.",
        card_alert_t: "Slimme Meldingen", card_alert_d: "Ontvang herinneringen voordat rekeningen vervallen.",
        about_title: "Onze Filosofie",
        about_t1: "First-Principle Denken",
        about_d1: "<p>BillBell is gebouwd door het probleem van gedeelde schulden terug te brengen tot de kern.</p>",
        about_t2: "Resultaten boven Beleefdheden",
        about_d2: "Wij waarderen logica en effectiviteit.",
        about_t3: "Strenge Beveiliging",
        about_d3: "<p>BillBell gebruikt een gedecentraliseerd encryptiemodel.</p>",
        about_cta_t: "Klaar voor Duidelijkheid?", about_cta_d: "Stop met gissen. Volg met logica.", about_btn: "Terug",
        faq_main_title: "Veelgestelde Vragen", faq_note: "Opmerking: FAQ-inhoud is momenteel alleen beschikbaar in het Engels.",
        priv_title: "Privacy & Gegevensbeveiliging",
        priv_t1: "Zero-Knowledge Architectuur",
        priv_d1: "<p>Uw gegevens worden versleuteld voordat ze uw apparaat verlaten.</p>",
        priv_t2: "Google Gebruikersgegevens",
        priv_d2: "<p>Wij gebruiken uw Google-gegevens alleen voor authenticatie.</p>",
        priv_t3: "Wat wij NIET verzamelen",
        priv_d3: "Wij verkopen of analyseren uw uitgavenpatroon niet.",
        supp_title: "Support Center", supp_h1: "Contact Technische Support", supp_sub: "Directe assistentie",
        lbl_email: "Uw Geregistreerde E-mail", lbl_cat: "Categorie", lbl_desc: "Beschrijving", btn_send: "Verstuur",
        supp_res_t: "Veelvoorkomende Oplossingen", res_1_t: "Decriptie mislukt?", res_1_d: "Vraag de beheerder om de sleutel te roteren.",
        res_2_t: "Sync Problemen?", res_2_d: "Sleep omlaag om te vernieuwen.",
        sys_stat: "Systeemstatus: Operationeel",
        prep_title: "1. Voorbereiding", download_txt: "CSV Sjabloon Downloaden", prep_sub: "Gebruik deze headers:", th_header: "Header", th_req: "Vereist", th_fmt: "Formaat",
        upload_title: "2. Bulk Upload", upload_sub: "Synchroniseer rekeningen veilig", lbl_share: "Familie Deel ID", lbl_code: "Import Code", lbl_file: "Bestand (CSV)", btn: "Start Upload", res_title: "Resultaat",
        foot_copy: "&copy; " + new Date().getFullYear() + " BillBell, alle rechten voorbehouden.", foot_slogan: "Logische Efficiëntie. Strenge Privacy."
    },
    "pt-BR": {
        nav_home: "Início", nav_about: "Sobre", nav_faq: "FAQ", nav_upload: "Upload em Massa", nav_support: "Suporte", nav_privacy: "Privacidade",
        hero_title: "Junte-se à Família", hero_sub: "Sincronize contas perfeitamente.", invite_label: "Seu Código de Convite",
        why_title: "Por que BillBell?",
        card_priv_t: "Privacidade Total", card_priv_d: "Criptografia Zero-Knowledge significa que não podemos ver seus dados.",
        card_sync_t: "Sincronização Familiar", card_sync_d: "Mudanças atualizadas instantaneamente.",
        card_alert_t: "Alertas Inteligentes", card_alert_d: "Receba lembretes antes do vencimento.",
        about_title: "Nossa Filosofia",
        about_t1: "Pensamento de Primeiros Princípios",
        about_d1: "<p>BillBell foi construído reduzindo o problema da dívida compartilhada às suas verdades fundamentais.</p>",
        about_t2: "Resultados sobre Cortesia",
        about_d2: "Valorizamos a lógica e a eficácia.",
        about_t3: "Segurança Rigorosa",
        about_d3: "<p>BillBell utiliza um modelo de criptografia descentralizado.</p>",
        about_cta_t: "Pronto para Clareza?", about_cta_d: "Pare de adivinhar. Rastreie com lógica.", about_btn: "Voltar",
        faq_main_title: "Perguntas Frequentes", faq_note: "Nota: O conteúdo das FAQ está disponível apenas em inglês.",
        priv_title: "Privacidade e Segurança",
        priv_t1: "Arquitetura Zero-Knowledge",
        priv_d1: "<p>Seus dados são criptografados antes de sair do dispositivo.</p>",
        priv_t2: "Dados do Google",
        priv_d2: "<p>Usamos seus dados do Google apenas para autenticação.</p>",
        priv_t3: "O que NÃO coletamos",
        priv_d3: "Não vendemos nem analisamos seus hábitos de consumo.",
        supp_title: "Centro de Suporte", supp_h1: "Contatar Suporte", supp_sub: "Assistência direta",
        lbl_email: "Seu Email", lbl_cat: "Categoria", lbl_desc: "Descrição", btn_send: "Enviar",
        supp_res_t: "Resoluções Comuns", res_1_t: "Falha na descriptografia?", res_1_d: "Peça ao admin para rotacionar a chave.",
        res_2_t: "Problemas de Sync?", res_2_d: "Puxe para atualizar.",
        sys_stat: "Status do Sistema: Operacional",
        prep_title: "1. Preparação", download_txt: "Baixar Modelo CSV", prep_sub: "Cabeçalhos obrigatórios:", th_header: "Cabeçalho", th_req: "Obrigatório", th_fmt: "Formato",
        upload_title: "2. Upload em Massa", upload_sub: "Sincronize com segurança", lbl_share: "ID Familiar", lbl_code: "Código Import", lbl_file: "Arquivo (CSV)", btn: "Iniciar", res_title: "Resultado",
        foot_copy: "&copy; " + new Date().getFullYear() + " BillBell, todos os direitos reservados.", foot_slogan: "Eficiência Lógica. Privacidade Rigorosa."
    },
    ja: {
        nav_home: "ホーム", nav_about: "概要", nav_faq: "FAQ", nav_upload: "一括アップロード", nav_support: "サポート", nav_privacy: "プライバシー",
        hero_title: "ファミリーに参加", hero_sub: "デバイス間で請求書をシームレスに同期。", invite_label: "招待コード",
        why_title: "なぜ BillBell？",
        card_priv_t: "完全なプライバシー", card_priv_d: "ゼロ知識証明暗号化により、私たちがデータを見ることはありません。",
        card_sync_t: "ファミリー同期", card_sync_d: "変更はすべてのデバイスで即座に更新されます。",
        card_alert_t: "スマート通知", card_alert_d: "支払い期限前に通知を受け取れます。",
        about_title: "私たちの哲学",
        about_t1: "第一原理思考",
        about_d1: "<p>BillBellは、共有借金の問題を根本的な真実にまで削ぎ落として構築されました。</p>",
        about_t2: "お世辞より結果",
        about_d2: "私たちは論理と有効性を重視します。",
        about_t3: "厳格なセキュリティ",
        about_d3: "<p>BillBellは分散型暗号化モデルを使用しています。</p>",
        about_cta_t: "明確にする準備は？", about_cta_d: "推測はやめましょう。論理で追跡を。", about_btn: "戻る",
        faq_main_title: "よくある質問", faq_note: "注：FAQの内容は現在英語のみです。",
        priv_title: "プライバシーとセキュリティ",
        priv_t1: "ゼロ知識アーキテクチャ",
        priv_d1: "<p>データはデバイスを離れる前に暗号化されます。</p>",
        priv_t2: "Googleユーザーデータ",
        priv_d2: "<p>認証のためだけにGoogleデータを使用します。</p>",
        priv_t3: "収集しない情報",
        priv_d3: "支出習慣を販売または分析することはありません。",
        supp_title: "サポートセンター", supp_h1: "技術サポートへ連絡", supp_sub: "アカウントの直接サポート",
        lbl_email: "登録メール", lbl_cat: "カテゴリ", lbl_desc: "説明", btn_send: "送信",
        supp_res_t: "一般的な解決策", res_1_t: "復号化の失敗？", res_1_d: "管理者にキーのローテーションを依頼してください。",
        res_2_t: "同期の問題？", res_2_d: "画面を引き下げて更新してください。",
        sys_stat: "システム状態：正常",
        prep_title: "1. 準備", download_txt: "CSVテンプレートをダウンロード", prep_sub: "以下のヘッダーを正確に使用してください：", th_header: "ヘッダー", th_req: "必須", th_fmt: "形式",
        upload_title: "2. 一括アップロード", upload_sub: "請求書を安全に同期", lbl_share: "共有ID", lbl_code: "インポートコード", lbl_file: "ファイル (CSV)", btn: "開始", res_title: "結果",
        foot_copy: "&copy; " + new Date().getFullYear() + " BillBell, All rights reserved.", foot_slogan: "論理的効率。厳格なプライバシー。"
    },
    "zh-Hans": {
        nav_home: "首页", nav_about: "关于", nav_faq: "常见问题", nav_upload: "批量上传", nav_support: "支持", nav_privacy: "隐私",
        hero_title: "加入家庭", hero_sub: "跨设备无缝同步账单。", invite_label: "您的邀请码",
        why_title: "为什么选择 BillBell？",
        card_priv_t: "完全隐私", card_priv_d: "零知识加密意味着我们无法查看您的数据。",
        card_sync_t: "家庭同步", card_sync_d: "更改会在所有成员设备上即时更新。",
        card_alert_t: "智能提醒", card_alert_d: "在到期前收到提醒，不再支付滞纳金。",
        about_title: "我们的理念",
        about_t1: "第一性原理思考",
        about_d1: "<p>BillBell 旨在将共享债务问题剥离至其基本真理。</p>",
        about_t2: "结果重于客套",
        about_d2: "我们重视逻辑和有效性。",
        about_t3: "严密的安全性",
        about_d3: "<p>BillBell 使用去中心化加密模型。</p>",
        about_cta_t: "准备好变得清晰了吗？", about_cta_d: "停止猜测。用逻辑追踪。", about_btn: "返回",
        faq_main_title: "常见问题", faq_note: "注意：常见问题解答内容目前仅提供英文版本。",
        priv_title: "隐私与数据安全",
        priv_t1: "零知识架构",
        priv_d1: "<p>数据在离开设备前已被加密。</p>",
        priv_t2: "Google 用户数据",
        priv_d2: "<p>我们仅将您的 Google 数据用于身份验证。</p>",
        priv_t3: "我们不收集的信息",
        priv_d3: "我们不会出售或分析您的消费习惯。",
        supp_title: "支持中心", supp_h1: "联系技术支持", supp_sub: "账户直接协助",
        lbl_email: "注册邮箱", lbl_cat: "问题类别", lbl_desc: "描述", btn_send: "发送",
        supp_res_t: "常见解决方案", res_1_t: "解密失败？", res_1_d: "请管理员轮换家庭密钥。",
        res_2_t: "同步问题？", res_2_d: "下拉刷新账单页面。",
        sys_stat: "系统状态：正常",
        prep_title: "1. 准备工作", download_txt: "下载 CSV 模板", prep_sub: "必须准确使用以下标题：", th_header: "标题", th_req: "必填", th_fmt: "格式",
        upload_title: "2. 批量上传", upload_sub: "安全同步账单", lbl_share: "家庭共享 ID", lbl_code: "导入代码", lbl_file: "文件 (CSV)", btn: "开始上传", res_title: "结果",
        foot_copy: "&copy; " + new Date().getFullYear() + " BillBell, 版权所有。", foot_slogan: "逻辑效率。严密隐私。"
    }
  };


function applyLocale(lang) {
    // 1. Existing Text Logic
    const t = translations[lang] || translations.en;
    Object.keys(t).forEach(key => {
      const el = document.getElementById(key);
      if (el) el.innerHTML = t[key];
    });

    // 2. New Image Logic
    // This switches ./img/en.png to ./img/es.png, ./img/fr.png, etc.
    const imgEl = document.getElementById("hero_img");
    if (imgEl) {
        imgEl.src = `./img/${lang}.png`;
    }
  }

  window.onload = () => {
    const browserLang = navigator.language.split('-')[0];
    const langMap = { "en": "en", "es": "es", "de": "de", "fr": "fr", "it": "it", "nl": "nl", "pt": "pt-BR", "ja": "ja", "zh": "zh-Hans" };
    const targetLang = langMap[browserLang] || "en";
    document.getElementById("langPicker").value = targetLang;
    applyLocale(targetLang);
  };

  document.getElementById("langPicker").addEventListener("change", (e) => applyLocale(e.target.value));
</script>
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
Routes::dispatch();
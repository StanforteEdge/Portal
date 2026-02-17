<?php
/* Template Name: Organogram */

get_header();
?>

<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        padding: 20px;
    }

    .container {
        max-width: 1500px;
        margin: 0 auto;
        background: white;
        border-radius: 20px;
        padding: 40px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
    }

    /* Header Controls */
    .controls {
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
        flex-wrap: wrap;
        align-items: center;
    }

    .search-box {
        flex: 1;
        min-width: 250px;
        padding: 10px 15px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 14px;
    }

    .search-box:focus {
        outline: none;
        border-color: #667eea;
    }

    .zoom-controls {
        display: flex;
        gap: 8px;
    }

    .btn {
        padding: 8px 16px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.3s;
    }

    .btn:hover {
        background: #5568d3;
    }

    .btn-secondary {
        background: #e0e0e0;
        color: #333;
    }

    .btn-secondary:hover {
        background: #d0d0d0;
    }

    /* Breadcrumb */
    .breadcrumb {
        background: #f8f9fa;
        padding: 10px 15px;
        border-radius: 6px;
        margin-bottom: 20px;
        display: none;
        font-size: 14px;
        color: #666;
    }

    .breadcrumb.active {
        display: block;
    }

    h1 {
        text-align: center;
        color: #333;
        margin-bottom: 10px;
        font-size: 2.5em;
    }

    .subtitle {
        text-align: center;
        color: #666;
        margin-bottom: 20px;
        font-style: italic;
    }

    /* Chart Container with zoom/pan */
    .chart-wrapper {
        overflow: auto;
        border: 1px solid #e0e0e0;
        border-radius: 10px;
        position: relative;
        max-height: 800px;
    }

    .org-tree {
        display: flex;
        justify-content: center;
        padding: 20px;
        transform-origin: top left;
        transition: transform 0.3s;
        min-width: min-content;
    }

    .level {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    /* Toned down colors */
    .node {
        background: #e8eaf6;
        color: #333;
        padding: 12px 20px;
        border-radius: 10px;
        margin: 10px;
        position: relative;
        text-align: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        transition: all 0.3s;
        min-width: 200px;
        cursor: pointer;
    }

    .node:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .node.highlight {
        background: #fff176;
        box-shadow: 0 0 0 3px #ffd54f;
    }

    .board {
        background: #f3e5f5;
        font-weight: bold;
        font-size: 1.1em;
        border-left: 4px solid #9c27b0;
    }

    .ceo {
        background: #fce4ec;
        font-weight: bold;
        font-size: 1.1em;
        border-left: 4px solid #e91e63;
    }

    .coo {
        background: #e0f2f1;
        font-weight: bold;
        border-left: 4px solid #009688;
    }

    .director {
        background: #fff3e0;
        font-weight: bold;
        border-left: 4px solid #ff9800;
    }

    .manager {
        background: #e3f2fd;
        border-left: 4px solid #2196f3;
    }

    .lead {
        background: #f1f8e9;
        border-left: 4px solid #8bc34a;
    }

    .staff {
        background: #fafafa;
        font-size: 0.9em;
        border-left: 4px solid #9e9e9e;
    }

    .new-hire {
        background: #fff8e1;
        border: 2px dashed #ffa726;
        border-left: 4px solid #ffa726;
    }

    .dual-role {
        background: #e1f5fe;
        border-left: 4px solid #03a9f4;
    }

    /* Collapsible divisions */
    .division-container {
        margin: 20px 10px;
        padding: 20px;
        border: 2px solid #e0e0e0;
        border-radius: 15px;
        background: rgba(255, 255, 255, 0.9);
        position: relative;
    }

    .division-container.collapsed .division-content {
        display: none;
    }

    .ceo-reporting {
        border: 2px solid #e91e63;
        background: rgba(233, 30, 99, 0.03);
    }

    .division-container::before {
        content: '';
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        width: 2px;
        height: 30px;
        background: #333;
    }

    .division-title {
        text-align: center;
        font-weight: bold;
        color: #555;
        margin-bottom: 15px;
        font-size: 1.1em;
        cursor: pointer;
        user-select: none;
    }

    .division-title:hover {
        color: #667eea;
    }

    .division-title::before {
        content: '▼ ';
        font-size: 0.8em;
    }

    .division-container.collapsed .division-title::before {
        content: '▶ ';
    }

    .note {
        font-size: 0.8em;
        color: #666;
        font-style: italic;
    }

    .branch {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
    }

    .vertical-line {
        width: 2px;
        height: 30px;
        background: #333;
        margin: -5px 0;
    }

    .sub-unit {
        position: relative;
        margin-left: 40px;
    }

    .sub-unit::before {
        content: '';
        position: absolute;
        left: -20px;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        height: 2px;
        background: #333;
    }

    .sub-unit::after {
        content: '';
        position: absolute;
        left: -20px;
        top: 0;
        height: 100%;
        width: 2px;
        background: #333;
    }

    .legend {
        margin-top: 40px;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 10px;
    }

    .legend h3 {
        color: #333;
        margin-bottom: 15px;
    }

    .legend-item {
        display: inline-block;
        margin: 5px 10px;
        padding: 5px 10px;
        border-radius: 5px;
        font-size: 0.9em;
    }

    .reporting-line {
        font-size: 0.75em;
        opacity: 0.7;
        margin-top: 2px;
    }

    .name {
        font-weight: bold;
        font-size: 0.95em;
    }

    /* Mobile Responsiveness */
    @media (max-width: 768px) {
        .container {
            padding: 20px;
        }

        h1 {
            font-size: 1.8em;
        }

        .controls {
            flex-direction: column;
        }

        .search-box {
            width: 100%;
        }

        .chart-wrapper {
            max-height: 600px;
        }

        .node {
            min-width: 150px;
            padding: 10px;
            font-size: 0.85em;
        }

        .division-container {
            padding: 15px;
        }
    }

    @media (max-width: 480px) {
        h1 {
            font-size: 1.5em;
        }

        .node {
            min-width: 120px;
            padding: 8px;
            font-size: 0.8em;
        }
    }
</style>
<div class="container bg-white">
    <h1>STANFORTE EDGE</h1>
    <p class="subtitle">Limited by Guarantee</p>

    <!-- Controls -->
    <div class="controls">
        <input type="text" class="search-box" id="searchBox" placeholder="🔍 Search by name or position...">
        <div class="zoom-controls">
            <button class="btn" onclick="zoomIn()">Zoom In</button>
            <button class="btn" onclick="zoomOut()">Zoom Out</button>
            <button class="btn btn-secondary" onclick="resetZoom()">Reset</button>
            <button class="btn btn-secondary" onclick="expandAll()">Expand All</button>
            <button class="btn btn-secondary" onclick="collapseAll()">Collapse All</button>
        </div>
    </div>

    <!-- Breadcrumb -->
    <div class="breadcrumb" id="breadcrumb"></div>

    <div class="chart-wrapper" id="chartWrapper">
        <div class="org-tree" id="orgTree">
            <div class="level">
                <!-- Board -->
                <div class="node board">Board of Directors</div>

                <div class="vertical-line"></div>

                <!-- CEO -->
                <div class="branch">
                    <div class="node ceo">Chief Executive Officer<br><span class="name">Olusola Owonikoko</span></div>

                    <div class="vertical-line"></div>

                    <!-- Split between CEO and COO reporting -->
                    <div style="display: flex; gap: 50px; margin-top: 20px;">

                        <!-- CEO Direct Reports -->
                        <div style="display: flex; flex-direction: column; gap: 20px;">
                            <div style="text-align: center; font-weight: bold; color: #e91e63; margin-bottom: 10px;">CEO
                                Direct Reports</div>

                            <!-- Facity -->
                            <div class="division-container ceo-reporting" data-division="facity">
                                <div class="division-title">DIVISION: Facity<br><span class="note"
                                        style="font-weight: normal;">(Fintech - Students)</span></div>
                                <div class="division-content">
                                    <div class="node lead">Product Lead<br><span class="name">Dunsin
                                            Babatunde</span><br><span class="reporting-line">Reports to: CEO</span>
                                    </div>
                                    <div
                                        style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px; justify-content: center;">
                                        <div class="node staff">Developer<br><span class="name">Evans
                                                Chigbo</span><br><span class="reporting-line">Reports to: Product
                                                Lead</span></div>
                                        <div class="node staff">Developer<br><span class="name">Olaoluwa
                                                Owonikoko</span><br><span class="reporting-line">Reports to: Product
                                                Lead</span></div>
                                        <div class="node dual-role">Developer/IT Support<br><span class="name">Gbolahan
                                                Sholola*</span><br><span class="reporting-line">Reports to: Product
                                                Lead</span></div>
                                        <div class="node staff">UI/UX Designer<br><span class="name">Chibueze
                                                Umechukwu</span><br><span class="reporting-line">Reports to: Product
                                                Lead</span></div>
                                        <div>
                                            <div class="node staff">Comms Associate<br><span class="name">Anuoluwapo
                                                    Olujimi</span><br><span class="reporting-line">Reports to: Product
                                                    Lead</span></div>
                                            <div class="sub-unit" style="margin-top: 10px;">
                                                <div class="node staff">Designer<br><span
                                                        class="name">Jubilee</span><br><span
                                                        class="reporting-line">Reports to: Anuoluwapo</span></div>
                                            </div>
                                            <div class="sub-unit" style="margin-top: 15px;">
                                                <div class="node staff">Community Manager<br><span class="name">Fashola
                                                        Adewale</span><br><span class="reporting-line">Reports to:
                                                        Anuoluwapo</span></div>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Lafiami -->
                            <div class="division-container ceo-reporting" data-division="lafiami">
                                <div class="division-title">DIVISION: Lafiami<br><span class="note"
                                        style="font-weight: normal;">(Fintech - HMO)</span></div>
                                <div class="division-content">
                                    <div class="node director">Director, Lafiami<br><span class="name">Tosin
                                            Ishola</span><br><span class="reporting-line">Reports to: CEO</span></div>
                                    <div class="node lead" style="margin-top: 15px;">Operations & Growth Lead<br><span
                                            class="name">Temiloluwa Owonikoko**</span><br><span
                                            class="reporting-line">Reports to: Director</span></div>
                                </div>
                            </div>

                            <!-- Professional Services -->
                            <div class="division-container ceo-reporting" data-division="professional-services">
                                <div class="division-title">DIVISION: Professional Services</div>
                                <div class="division-content">
                                    <div class="node dual-role">Newsletter Services<br><span class="name">Temiloluwa
                                            Owonikoko** (INTERIM)</span><br><span class="reporting-line">Reports to:
                                            CEO</span></div>
                                    <div class="node dual-role">Disability Audit Services<br><span
                                            class="name">Temiloluwa Owonikoko** (INTERIM)</span><br><span
                                            class="reporting-line">Reports to: CEO</span></div>
                                </div>


                            </div>
                        </div>

                        <!-- COO and COO Direct Reports -->
                        <div>
                            <div class="node coo">Chief Operating Officer<br><span class="name">Olalekan
                                    Owonikoko</span><br><span class="reporting-line">Reports to: CEO</span></div>

                            <div style="display: flex; gap: 30px; margin-top: 20px;">

                                <!-- Operations Branch -->
                                <div class="division-container" data-division="operations"
                                    style="background: rgba(48, 207, 208, 0.05);">
                                    <div class="division-title">OPERATIONS</div>
                                    <div class="division-content">

                                        <!-- Finance -->
                                        <div style="margin-bottom: 20px;">
                                            <div class="node new-hire">Finance Lead<br><span class="note">[NEW HIRE - by
                                                    March]</span><br><span class="reporting-line">Reports to: COO</span>
                                            </div>
                                        </div>

                                        <!-- Admin -->
                                        <div style="margin-bottom: 20px;">
                                            <div class="node dual-role">Admin Lead / Acting Finance Lead***<br><span
                                                    class="name">Ademibolanle Adesida</span><br><span
                                                    class="reporting-line">Reports to: COO</span></div>
                                            <div style="margin-top: 15px;">
                                                <div class="sub-unit">
                                                    <div class="node staff">Admin Associate<br><span
                                                            class="name">Precious Odejide</span><br><span
                                                            class="reporting-line">Reports to: Admin Lead</span></div>
                                                </div>
                                                <div class="sub-unit" style="margin-top: 10px;">
                                                    <div class="node staff">Procurement/Facility Officer<br><span
                                                            class="name">Funsho Adun</span><br><span
                                                            class="reporting-line">Reports to: Admin Lead</span></div>
                                                </div>
                                                <div class="sub-unit" style="margin-top: 10px;">
                                                    <div class="node staff">Office Assistant<br><span class="name">Rita
                                                            Farinloye</span><br><span class="reporting-line">Reports to:
                                                            Admin Lead</span></div>
                                                </div>
                                                <div class="sub-unit" style="margin-top: 10px;">
                                                    <div class="node staff">Security<br><span class="name">Samuel
                                                            Moze</span><br><span class="reporting-line">Reports to:
                                                            Admin Lead</span></div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- HR -->
                                        <div style="margin-bottom: 20px;">
                                            <div class="node manager">Human Resource Lead<br><span class="name">Adunoye
                                                    Adegboye</span><br><span class="reporting-line">Reports to:
                                                    COO</span></div>
                                            <div class="sub-unit" style="margin-top: 15px;">
                                                <div class="node staff">HR Associate<br><span class="name">Ifeoluwa
                                                        Faluyi</span><br><span class="reporting-line">Reports to: HR
                                                        Lead</span></div>
                                            </div>
                                        </div>

                                        <!-- Communications -->
                                        <div>
                                            <div class="node manager">Communications Lead<br><span class="name">Allen
                                                    Abu</span><br><span class="reporting-line">Reports to: COO</span>
                                            </div>
                                            <div style="display: flex; gap: 10px; margin-top: 15px; margin-left: 40px;">
                                                <div class="node staff">Comms Associate<br><span class="name">Vivian
                                                        Umeh</span><br><span class="reporting-line">Reports to: Comms
                                                        Lead</span></div>
                                                <div class="node staff">Comms Associate<br><span class="name">Oscar
                                                        Igrubia</span><br><span class="reporting-line">Reports to: Comms
                                                        Lead</span></div>
                                            </div>
                                        </div>

                                        <!-- Business Development -->
                                        <div style="margin-top: 20px;">
                                            <div class="node new-hire">Business Development Lead<br><span
                                                    class="note">Adunoye Adegboye**[INTERIM]</span><br><span
                                                    class="reporting-line">Reports to: COO</span></div>
                                        </div>
                                        <!-- Data & Compliance -->
                                        <div style="margin-top: 20px;">
                                            <div class="node staff ">Data & Compliance Lead<br><span class="note">Almond
                                                    Owolabi</span><br><span class="reporting-line">Reports to:
                                                    COO</span></div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Divisions reporting to COO -->
                                <div style="display: flex; flex-direction: column; gap: 20px;">

                                    <!-- Project Enable Africa -->
                                    <div class="division-container" data-division="project-enable">
                                        <div class="division-title">DIVISION: Project Enable Africa</div>
                                        <div class="division-content">
                                            <div class="node lead">Programs Lead<br><span class="name">Micheal
                                                    Ojediran</span><br><span class="reporting-line">Reports to:
                                                    COO</span></div>
                                            <div
                                                style="display: flex; gap: 10px; margin-top: 15px; justify-content: center; flex-wrap: wrap;">
                                                <div class="node staff">Programs Associate<br><span class="name">Janet
                                                        Adegoke</span><br><span class="reporting-line">Reports to:
                                                        Programs Lead</span></div>
                                                <div class="node staff">Programs Associate<br><span class="name">Kemi
                                                        Odusanya</span><br><span class="reporting-line">Reports to:
                                                        Programs Lead</span></div>
                                            </div>
                                        </div>
                                    </div>


                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="legend">
        <h3>Notes:</h3>
        <p>* Gbolahan Sholola also provides IT support to all divisions</p>
        <p>** Temiloluwa Owonikoko has a dual role (Lafiami Operations & Growth Lead and Professional Services
            Newsletter - Interim)</p>
        <p>*** Ademibolanle Adesida - Admin Lead, also serving as Acting Finance Lead until permanent Finance Lead is
            hired by March</p>
        <div style="margin-top: 15px;">
            <span class="legend-item new-hire">New Hire Needed</span>
            <span class="legend-item dual-role">Dual Role/Acting/Interim</span>
        </div>
        <div style="margin-top: 15px;">
            <h4>Reporting Structure:</h4>
            <ul style="margin-top: 10px; line-height: 1.8;">
                <li>CEO (Olusola Owonikoko) reports to Board of Directors</li>
                <li>COO (Olalekan Owonikoko) reports to CEO</li>
                <li>Dunsin Babatunde (Facity Product Lead) reports directly to CEO</li>
                <li>Tosin Ishola (Lafiami Director) reports directly to CEO</li>
                <li>Temiloluwa Owonikoko (Professional Services) reports directly to CEO</li>
                <li>All other Division Leads and Department Leads report to COO</li>
                <li>Staff members report to their respective leads</li>
            </ul>
        </div>
    </div>
</div>

<script>
    let currentZoom = 1;
    const orgTree = document.getElementById('orgTree');
    const chartWrapper = document.getElementById('chartWrapper');
    const searchBox = document.getElementById('searchBox');
    const breadcrumb = document.getElementById('breadcrumb');

    // Zoom functions
    function zoomIn() {
        currentZoom = Math.min(currentZoom + 0.1, 2);
        updateZoom();
    }

    function zoomOut() {
        currentZoom = Math.max(currentZoom - 0.1, 0.5);
        updateZoom();
    }

    function resetZoom() {
        currentZoom = 1;
        updateZoom();
    }

    function updateZoom() {
        orgTree.style.transform = `scale(${currentZoom})`;
    }

    // Expand/Collapse functions
    function expandAll() {
        document.querySelectorAll('.division-container').forEach(div => {
            div.classList.remove('collapsed');
        });
    }

    function collapseAll() {
        document.querySelectorAll('.division-container').forEach(div => {
            div.classList.add('collapsed');
        });
    }

    // Search functionality
    searchBox.addEventListener('input', function (e) {
        const searchTerm = e.target.value.toLowerCase();
        const allNodes = document.querySelectorAll('.node');

        allNodes.forEach(node => {
            node.classList.remove('highlight');

            if (searchTerm && node.textContent.toLowerCase().includes(searchTerm)) {
                node.classList.add('highlight');

                // Show breadcrumb for first match
                if (!breadcrumb.classList.contains('active')) {
                    updateBreadcrumb(node);
                }
            } else if (!searchTerm) {
                breadcrumb.classList.remove('active');
            }
        });
    });

    // Breadcrumb functionality
    function updateBreadcrumb(node) {
        const path = [];
        let current = node;

        while (current) {
            const nameSpan = current.querySelector('.name');
            if (nameSpan) {
                path.unshift(nameSpan.textContent);
            }

            // Find parent node
            const reportingLine = current.querySelector('.reporting-line');
            if (reportingLine) {
                const reportsTo = reportingLine.textContent.replace('Reports to: ', '');
                const parentNode = Array.from(document.querySelectorAll('.name')).find(
                    el => el.textContent === reportsTo
                );
                current = parentNode ? parentNode.closest('.node') : null;
            } else {
                break;
            }
        }

        breadcrumb.textContent = '📍 ' + path.join(' → ');
        breadcrumb.classList.add('active');
    }

    // Click node to show breadcrumb
    document.querySelectorAll('.node').forEach(node => {
        node.addEventListener('click', function (e) {
            e.stopPropagation();
            updateBreadcrumb(this);
        });
    });

    // Toggle division collapse on title click
    document.querySelectorAll('.division-title').forEach(title => {
        title.addEventListener('click', function (e) {
            e.stopPropagation();
            this.closest('.division-container').classList.toggle('collapsed');
        });
    });

    // Click outside to clear breadcrumb
    document.addEventListener('click', function () {
        breadcrumb.classList.remove('active');
    });

    // Pan functionality with mouse drag
    let isDragging = false;
    let startX, startY, scrollLeft, scrollTop;

    chartWrapper.addEventListener('mousedown', function (e) {
        if (e.target === chartWrapper || e.target === orgTree) {
            isDragging = true;
            startX = e.pageX - chartWrapper.offsetLeft;
            startY = e.pageY - chartWrapper.offsetTop;
            scrollLeft = chartWrapper.scrollLeft;
            scrollTop = chartWrapper.scrollTop;
            chartWrapper.style.cursor = 'grabbing';
        }
    });

    chartWrapper.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - chartWrapper.offsetLeft;
        const y = e.pageY - chartWrapper.offsetTop;
        const walkX = (x - startX) * 1.5;
        const walkY = (y - startY) * 1.5;
        chartWrapper.scrollLeft = scrollLeft - walkX;
        chartWrapper.scrollTop = scrollTop - walkY;
    });

    chartWrapper.addEventListener('mouseup', function () {
        isDragging = false;
        chartWrapper.style.cursor = 'default';
    });

    chartWrapper.addEventListener('mouseleave', function () {
        isDragging = false;
        chartWrapper.style.cursor = 'default';
    });
</script>

<?php get_footer(); ?>
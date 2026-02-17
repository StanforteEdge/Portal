<?php /* Template Name: Email Template */ ?>


<html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">

<head>
    <title>Stanforte Edge Portal</title>
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <!--[if mso
      ]><xml
        ><o:OfficeDocumentSettings
          ><o:PixelsPerInch>96</o:PixelsPerInch
          ><o:AllowPNG /></o:OfficeDocumentSettings></xml
    ><![endif]-->
    <style>
        .row-outer {

            text-align: center;
            vertical-align: middle;

        }

        .row-inner {
            width: 100%;
            margin: auto;


        }

        .header {
            background: radial-gradient(circle, #ffffff, #1E293B);
            background-repeat: no-repeat;
            background-size: cover;
            background-position: center;
            width: 100%;
            height: 80px;
            display: flex;
            align-items: center;
            padding:20px;

        }

        .logo {
            width: 30%;
        }

        .outer-content {
            padding: 20px;
            background-color: #fff;
            font-family: sans-serif;


        }

        .inner-content {
            border-top: 1px solid #242323;
            border-bottom: 1px solid #242323;
            padding-left: 10%;
            padding-right: 10%;
            padding-top: 10px;
            padding-bottom: 10px;
        }

        .btn {
            background-color: black;
            color: white;
            padding: 8px 20px;
            border-radius: 30px;
            margin-top: 15px !important;
        }
        .title {
            margin: 0;
            font-size: 16px;
            text-align: center;
            mso-line-height-alt: 19.2px;
            padding-top: 5px;
            padding-bottom: 15px;
            word-wrap: break-word;
        }

        .content {
            padding: 15px;
            margin: 0;
            font-size: 14px;
            mso-line-height-alt: 16.8px;
            word-wrap: break-word;
            text-align: left;
        }

        p {
            padding: 0 0 10px 0;
            font-size: 14px;
            mso-line-height-alt: 16.8px;
        }

        .footer {
            padding: 10px;
        }

        .footer-text {
            font-size: 10px;
        }

        button {
            padding: 8px 20px 8px 20px;
            background-color: #000;
            color: #fff;
            border: none;
            border-radius: 50px;
        }
    </style>
</head>

<body style="background-color: #242323; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;
    ">
    <div class="row-outer">
        <div class="row-inner">
            <div class="header">
                <a href="https://staff.stanforteedge.com"><img class="logo" src="https://staff.stanforteedge.com/wp-content/uploads/2024/01/stanforteedge-Shared-Prosperity.png"></a>
            </div>
            <div class="outer-content">
                <h4 class="title"> <strong>{title_content}</strong></h4>
                <div class="inner-content">
                    <div class="content">
                        {body_content}
                    </div>
                    <div>
                        <!-- <button type="button" class="button">Confirm</button> -->
                    </div>
                </div>
                <div class="footer">
                    <span class="footer-text">© 2024, <a href="https://stanforteedge.com">Stanforte Edge</a> | Lagos, Nigeria</span>
                </div>

            </div>
        </div>
</body>

</html>
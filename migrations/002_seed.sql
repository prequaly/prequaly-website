-- =====================================================================
-- PREQUALY — migration 002: seed the 5-county SoCal launch corpus
-- All figures are 2026 PLANNING ESTIMATES pending verification
-- (see Program_Verification_Workbook.xlsx). verified_at reflects last check.
-- =====================================================================

-- ---------- income tables (matrix keyed by household size or county)
insert into income_tables (slug, name, year, matrix, source_url) values
('calhfa_myhome','CalHFA MyHome county income limits',2026,'{"Los Angeles":172800,"Orange":202000,"Riverside":155000,"San Bernardino":155000,"San Diego":190000,"default":150000}','https://www.calhfa.ca.gov/homeownership/limits/'),
('calhfa_dream_for_all','CalHFA Dream For All county limits',2026,'{"Los Angeles":172800,"Orange":216000,"Riverside":155000,"San Bernardino":155000,"San Diego":190000,"default":150000}','https://www.calhfa.ca.gov/dream/'),
('calhfa_febl_80ami','CalHFA FEBL ~80% AMI by county',2026,'{"Los Angeles":85360,"Orange":88400,"Riverside":83120,"San Bernardino":83120,"San Diego":91550,"default":80000}','https://www.calhfa.ca.gov/homeownership/programs/forgivable.htm'),
('gsfa_platinum','GSFA Platinum county limits',2026,'{"Los Angeles":172800,"Orange":202000,"Riverside":155000,"San Bernardino":155000,"San Diego":190000,"default":150000}','https://www.gsfahome.org/'),
('la_lipa_low','LA LIPA low-income by household size',2026,'{"1":76800,"2":87750,"3":98700,"4":109650,"5":118450,"default":118450}','https://housing.lacity.gov/'),
('long_beach_80ami','Long Beach ~80% AMI by size',2026,'{"1":74650,"2":85300,"3":95950,"4":106600,"5":115150,"default":115150}','https://www.longbeach.gov/'),
('oc_map_80ami','OC MAP ~80% AMI by size',2026,'{"1":88400,"2":101000,"3":113650,"4":126250,"5":136350,"default":136350}','https://www.ochousing.org/'),
('orange_80ami','Orange County ~80% AMI by size',2026,'{"1":88400,"2":101000,"3":113650,"4":126250,"5":136350,"default":136350}','https://www.hcd.ca.gov/'),
('riverside_plha_120ami','Riverside PLHA ~120% AMI by size',2026,'{"1":87300,"2":99760,"3":112230,"4":124680,"5":134680,"default":134680}','https://rivcohws.org/'),
('riverside_home_80ami','Riverside HOME ~80% AMI by size',2026,'{"1":62650,"2":71600,"3":80550,"4":89500,"5":96700,"default":96700}','https://rivcohws.org/'),
('ie_80ami','Inland Empire ~80% AMI by size',2026,'{"1":62650,"2":71600,"3":80550,"4":89500,"5":96700,"default":96700}','https://www.hcd.ca.gov/'),
('ie_120ami','Inland Empire ~120% AMI by size',2026,'{"1":87300,"2":99760,"3":112230,"4":124680,"5":134680,"default":134680}','https://www.hcd.ca.gov/'),
('san_diego_80ami','San Diego ~80% AMI by size',2026,'{"1":77250,"2":88250,"3":99300,"4":110300,"5":119150,"default":119150}','https://www.sdhc.org/'),
('san_diego_120ami','San Diego ~120% AMI by size',2026,'{"1":116000,"2":132600,"3":149150,"4":165700,"5":179000,"default":179000}','https://www.sdhc.org/'),
('county_ami_100','HUD 100% AMI by county and size',2026,'{"Los Angeles":{"1":74650,"2":85300,"3":95950,"4":106600,"5":115150,"default":115150},"Orange":{"1":95350,"2":108950,"3":122600,"4":136200,"5":147100,"default":147100},"Riverside":{"1":68800,"2":78650,"3":88450,"4":98300,"5":106150,"default":106150},"San Bernardino":{"1":68800,"2":78650,"3":88450,"4":98300,"5":106150,"default":106150},"San Diego":{"1":91550,"2":104650,"3":117700,"4":130800,"5":141250,"default":141250},"default":{"1":74650,"2":85300,"3":95950,"4":106600,"default":106600}}','https://www.huduser.gov/portal/datasets/il.html');

-- ---------- organizations
insert into organizations (name, org_type, website) values
('CalHFA','government','https://www.calhfa.ca.gov'),
('Golden State Finance Authority','government','https://www.gsfahome.org'),
('U.S. Dept. of Veterans Affairs','government','https://www.va.gov'),
('CalVet','government','https://www.calvet.ca.gov'),
('City of Los Angeles LAHD','government','https://housing.lacity.gov'),
('LACDA','government','https://www.lacda.org'),
('City of Long Beach','government','https://www.longbeach.gov'),
('OC Housing & Community Development','government','https://www.ochousing.org'),
('City of Santa Ana','government','https://www.santa-ana.org'),
('Irvine Community Land Trust','developer','https://irvineclt.org'),
('City of Riverside','government','https://riversideca.gov'),
('Riverside County HWS','government','https://rivcohws.org'),
('City of Moreno Valley','government','https://moval.gov'),
('Neighborhood Housing Services IE','nonprofit','https://www.nhsie.org'),
('NPHS','nonprofit','https://nphsinc.org'),
('City of Ontario / NPHS','nonprofit','https://www.ontarioca.gov'),
('San Diego Housing Commission','government','https://www.sdhc.org'),
('County of San Diego','government','https://www.sandiegocounty.gov'),
('County MCC issuers','government',null);

-- ---------- programs + versions (rules are data; fixable rules carry "fixable":true)
create or replace function seed_program(
  p_slug text, p_name text, p_org text, p_src text, p_status text,
  p_geo_inc jsonb, p_geo_exc jsonb, p_rules jsonb, p_benefit jsonb,
  p_stacking jsonb, p_blurb text, p_verified date
) returns void language plpgsql as $$
declare v_prog uuid; v_ver uuid; v_org uuid;
begin
  select id into v_org from organizations where name = p_org;
  insert into programs (slug, name, admin_org_id, source_type, status)
  values (p_slug, p_name, v_org, p_src, p_status) returning id into v_prog;
  insert into program_versions (program_id, version, geo_include, geo_exclude,
    rules, benefit, stacking, blurb, verified_at, published)
  values (v_prog, 1, p_geo_inc, p_geo_exc, p_rules, p_benefit, p_stacking, p_blurb, p_verified, true)
  returning id into v_ver;
  update programs set current_version_id = v_ver where id = v_prog;
end $$;

select seed_program('myhome','CalHFA MyHome Assistance','CalHFA','government','active',
 '[{"county":"*"}]','[]',
 '[{"id":"ft","fact":"first_time","op":"==","value":true,"msg":"be a first-time buyer (no home owned in 3 years)"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"live in the home as your primary residence"},{"id":"edu","fact":"education","op":"==","value":true,"msg":"finish a homebuyer education class","fixable":true},{"id":"inc","fact":"income","op":"<=","value":{"table":"calhfa_myhome","by":"county"},"msg":"meet CalHFA county income limits"}]',
 '{"type":"deferred_second","amount_rule":"0.035*price"}',
 '{"layer":"primary_dpa","conflicts_with":["dream"]}',
 'Deferred down-payment loan up to 3.5% of the price. No monthly payments — repaid when you sell or refinance.','2026-06-01');

select seed_program('zip','CalPLUS + ZIP Closing Help','CalHFA','government','active',
 '[{"county":"*"}]','[]',
 '[{"id":"ft","fact":"first_time","op":"==","value":true,"msg":"be a first-time buyer"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"},{"id":"edu","fact":"education","op":"==","value":true,"msg":"finish homebuyer education","fixable":true}]',
 '{"type":"deferred_second_closing","amount_rule":"0.03*loan"}',
 '{"layer":"closing","conflicts_with":[]}',
 'Zero-interest help with closing costs, paired with a CalPLUS first mortgage.','2026-06-01');

select seed_program('dream','Dream For All Shared Appreciation','CalHFA','government','lottery_closed',
 '[{"county":"*"}]','[]',
 '[{"id":"ft","fact":"first_time","op":"==","value":true,"msg":"be a first-time buyer"},{"id":"fg","fact":"first_generation","op":"==","value":true,"msg":"be a first-generation buyer"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"},{"id":"inc","fact":"income","op":"<=","value":{"table":"calhfa_dream_for_all","by":"county"},"msg":"meet Dream For All income limits"}]',
 '{"type":"shared_appreciation","amount_rule":"min(0.20*price,150000)"}',
 '{"layer":"primary_dpa","conflicts_with":["myhome"]}',
 'Up to 20% (max $150k) toward your down payment as a shared-appreciation loan. Lottery-based — currently closed.','2026-05-01');

select seed_program('febl','Forgivable Equity Builder Loan','CalHFA','government','active_verify',
 '[{"county":"*"}]','[]',
 '[{"id":"ft","fact":"first_time","op":"==","value":true,"msg":"be a first-time buyer"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"},{"id":"inc","fact":"income","op":"<=","value":{"table":"calhfa_febl_80ami","by":"county"},"msg":"earn under ~80% of area median income"}]',
 '{"type":"forgivable_loan","amount_rule":"0.10*price","forgiveness_years":5}',
 '{"layer":"primary_dpa","conflicts_with":[]}',
 'Up to 10% of the price, fully forgiven after 5 years in the home. Funding-dependent.','2026-04-01');

select seed_program('gsfa','GSFA Platinum Grant','Golden State Finance Authority','government','active',
 '[{"county":"*"}]','[]',
 '[{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"},{"id":"inc","fact":"income","op":"<=","value":{"table":"gsfa_platinum","by":"county"},"msg":"meet GSFA income limits"}]',
 '{"type":"grant","amount_rule":"0.055*loan"}',
 '{"layer":"grant","conflicts_with":[]}',
 'Up to 5.5% toward down payment and closing costs — first-time status NOT required.','2026-06-01');

select seed_program('mcc','Mortgage Credit Certificate (MCC)','County MCC issuers','government','active_verify',
 '[{"county":"*"}]','[]',
 '[{"id":"ft","fact":"first_time","op":"==","value":true,"msg":"be a first-time buyer"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"}]',
 '{"type":"tax_credit"}','{"layer":"tax_credit","conflicts_with":[]}',
 'A federal tax credit worth up to 20% of yearly mortgage interest.','2026-03-01');

select seed_program('va','VA Home Loan — $0 Down','U.S. Dept. of Veterans Affairs','government','active',
 '[{"county":"*"}]','[]',
 '[{"id":"vet","fact":"veteran","op":"==","value":true,"msg":"be a veteran or active-duty service member"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"}]',
 '{"type":"financing"}','{"layer":"financing","conflicts_with":[]}',
 'Zero down, no mortgage insurance, competitive rates — and it stacks with assistance programs.','2026-06-01');

select seed_program('calvet','CalVet Home Loan','CalVet','government','active',
 '[{"county":"*"}]','[]',
 '[{"id":"vet","fact":"veteran","op":"==","value":true,"msg":"be a California veteran"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"}]',
 '{"type":"financing"}','{"layer":"financing","conflicts_with":[]}',
 'Below-market financing for California veterans, with low-cost disaster coverage included.','2026-06-01');

select seed_program('la-lipa','LA Low Income Purchase Assistance (LIPA)','City of Los Angeles LAHD','government','active',
 '[{"city":"Los Angeles","county":"Los Angeles"}]','[]',
 '[{"id":"ft","fact":"first_time","op":"==","value":true,"msg":"be a first-time buyer"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"},{"id":"edu","fact":"education","op":"==","value":true,"msg":"finish homebuyer education","fixable":true},{"id":"inc","fact":"income","op":"<=","value":{"table":"la_lipa_low","by":"size"},"msg":"meet LIPA low-income limits"}]',
 '{"type":"deferred_second","amount_rule":"up_to_140000"}',
 '{"layer":"primary_dpa","conflicts_with":[]}',
 'Up to $140,000 in deferred down-payment and closing help inside the City of LA.','2026-06-01');

select seed_program('la-mipa','LA Moderate Income Purchase Assistance','City of Los Angeles LAHD','government','active_verify',
 '[{"city":"Los Angeles","county":"Los Angeles"}]','[]',
 '[{"id":"ft","fact":"first_time","op":"==","value":true,"msg":"be a first-time buyer"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"},{"id":"edu","fact":"education","op":"==","value":true,"msg":"finish homebuyer education","fixable":true},{"id":"inc","fact":"income","op":"<=","value":{"ami_pct":150,"table":"county_ami_100","by":"size"},"msg":"earn under ~150% of area median income"}]',
 '{"type":"deferred_second","amount_rule":"up_to_115000"}',
 '{"layer":"primary_dpa","conflicts_with":["la-lipa"]}',
 'Up to $115,000 for moderate-income buyers in the City of LA, above LIPA limits.','2026-05-01');

select seed_program('lacda','LA County Affordable Homeownership','LACDA','government','active_verify',
 '[{"county":"Los Angeles"}]','[{"city":"Los Angeles"}]',
 '[{"id":"ft","fact":"first_time","op":"==","value":true,"msg":"be a first-time buyer"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"},{"id":"edu","fact":"education","op":"==","value":true,"msg":"finish homebuyer education","fixable":true}]',
 '{"type":"deferred_second","amount_rule":"up_to_75000"}',
 '{"layer":"primary_dpa","conflicts_with":[]}',
 'Down-payment help for LA County communities outside the City of LA.','2026-04-01');

select seed_program('long-beach','Long Beach First-Time Homebuyer','City of Long Beach','government','active_verify',
 '[{"city":"Long Beach","county":"Los Angeles"}]','[]',
 '[{"id":"ft","fact":"first_time","op":"==","value":true,"msg":"be a first-time buyer"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"},{"id":"edu","fact":"education","op":"==","value":true,"msg":"finish homebuyer education","fixable":true},{"id":"inc","fact":"income","op":"<=","value":{"table":"long_beach_80ami","by":"size"},"msg":"meet Long Beach income limits"}]',
 '{"type":"deferred_second","amount_rule":"up_to_50000"}',
 '{"layer":"primary_dpa","conflicts_with":[]}',
 'Deferred second loan for buyers purchasing in Long Beach.','2026-03-01');

select seed_program('oc-map','Orange County Mortgage Assistance (MAP)','OC Housing & Community Development','government','active',
 '[{"city":"Yorba Linda","county":"Orange"},{"city":"Placentia"},{"city":"Brea"},{"city":"Other city in Orange County"}]','[]',
 '[{"id":"ft","fact":"first_time","op":"==","value":true,"msg":"be a first-time buyer"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"},{"id":"edu","fact":"education","op":"==","value":true,"msg":"finish homebuyer education","fixable":true},{"id":"own","fact":"own_funds_pct","op":">=","value":0.01,"msg":"contribute 1% of your own funds","fixable":true},{"id":"inc","fact":"income","op":"<=","value":{"table":"oc_map_80ami","by":"size"},"msg":"meet OC MAP income limits"}]',
 '{"type":"deferred_second","amount_rule":"min(0.20*price,80000)"}',
 '{"layer":"primary_dpa","conflicts_with":[]}',
 'Silent second loan up to $80,000 in participating Orange County cities.','2026-06-01');

select seed_program('oc-santaana','Santa Ana Down Payment Assistance','City of Santa Ana','government','active_verify',
 '[{"city":"Santa Ana","county":"Orange"}]','[]',
 '[{"id":"ft","fact":"first_time","op":"==","value":true,"msg":"be a first-time buyer"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"},{"id":"own","fact":"own_funds_pct","op":">=","value":0.03,"msg":"contribute 3% of your own funds","fixable":true},{"id":"inc","fact":"income","op":"<=","value":{"table":"orange_80ami","by":"size"},"msg":"meet Santa Ana income limits"}]',
 '{"type":"deferred_second","amount_rule":"up_to_40000"}',
 '{"layer":"primary_dpa","conflicts_with":[]}',
 'Up to $40,000 for buyers purchasing in Santa Ana.','2026-04-01');

select seed_program('oc-irvine-clt','Irvine Community Land Trust Home','Irvine Community Land Trust','developer','active_verify',
 '[{"city":"Irvine","county":"Orange"}]','[]',
 '[{"id":"ft","fact":"first_time","op":"==","value":true,"msg":"be a first-time buyer"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"},{"id":"inc","fact":"income","op":"<=","value":{"table":"orange_80ami","by":"size"},"msg":"meet the community income limits"}]',
 '{"type":"bmr_ownership"}','{"layer":"bmr","conflicts_with":[]}',
 'Buy a home well below market price; resale limits keep it affordable for the next family too.','2026-05-01');

select seed_program('riv-homestarter','Riverside HomeStarter','City of Riverside','government','active',
 '[{"city":"Riverside","county":"Riverside"}]','[]',
 '[{"id":"ft","fact":"first_time","op":"==","value":true,"msg":"be a first-time buyer"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"},{"id":"edu","fact":"education","op":"==","value":true,"msg":"finish homebuyer education","fixable":true}]',
 '{"type":"deferred_second","amount_rule":"up_to_50000"}',
 '{"layer":"primary_dpa","conflicts_with":[]}',
 'City down-payment help for homes inside Riverside city limits.','2026-06-01');

select seed_program('riv-plha','Riverside County PLHA Assistance','Riverside County HWS','government','active',
 '[{"county":"Riverside"}]','[{"city":"Riverside"}]',
 '[{"id":"ft","fact":"first_time","op":"==","value":true,"msg":"be a first-time buyer"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"},{"id":"edu","fact":"education","op":"==","value":true,"msg":"finish homebuyer education","fixable":true},{"id":"inc","fact":"income","op":"<=","value":{"table":"riverside_plha_120ami","by":"size"},"msg":"earn under ~120% of area median income"}]',
 '{"type":"deferred_second","amount_rule":"min(0.20*price,100000)","forgiveness_years":30}',
 '{"layer":"primary_dpa","conflicts_with":[]}',
 'Up to $100,000, forgiven after 30 years in the home (county areas outside the City of Riverside).','2026-06-01');

select seed_program('riv-home','Riverside County HOME Program','Riverside County HWS','government','active',
 '[{"county":"Riverside"}]','[]',
 '[{"id":"ft","fact":"first_time","op":"==","value":true,"msg":"be a first-time buyer"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"},{"id":"edu","fact":"education","op":"==","value":true,"msg":"finish homebuyer education","fixable":true},{"id":"inc","fact":"income","op":"<=","value":{"table":"riverside_home_80ami","by":"size"},"msg":"earn under ~80% of area median income"}]',
 '{"type":"deferred_second","amount_rule":"up_to_60000","forgiveness_years":15}',
 '{"layer":"primary_dpa","conflicts_with":[]}',
 'Up to 20% of the price, forgiven after 15 years.','2026-05-01');

select seed_program('mor-valley','Moreno Valley Homebuyer Assistance','City of Moreno Valley','government','active_verify',
 '[{"city":"Moreno Valley","county":"Riverside"}]','[]',
 '[{"id":"ft","fact":"first_time","op":"==","value":true,"msg":"be a first-time buyer"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"},{"id":"edu","fact":"education","op":"==","value":true,"msg":"finish homebuyer education","fixable":true},{"id":"inc","fact":"income","op":"<=","value":{"table":"ie_80ami","by":"size"},"msg":"meet the city income limits"}]',
 '{"type":"deferred_second","amount_rule":"up_to_50000"}',
 '{"layer":"primary_dpa","conflicts_with":[]}',
 'Deferred-payment second loan for homes in Moreno Valley.','2026-02-01');

select seed_program('sb-nhsie','NHSIE CalHome Assistance','Neighborhood Housing Services IE','nonprofit','active',
 '[{"county":"San Bernardino"}]','[]',
 '[{"id":"ft","fact":"first_time","op":"==","value":true,"msg":"be a first-time buyer"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"},{"id":"edu","fact":"education","op":"==","value":true,"msg":"finish homebuyer education","fixable":true},{"id":"inc","fact":"income","op":"<=","value":{"table":"ie_80ami","by":"size"},"msg":"earn under ~80% of area median income"}]',
 '{"type":"deferred_second","amount_rule":"up_to_55000"}',
 '{"layer":"primary_dpa","conflicts_with":[]}',
 'Up to $55,000 through a HUD-approved nonprofit lender.','2026-06-01');

select seed_program('ie-iedpa','Inland Empire DPA (IEDPA)','NPHS','nonprofit','active',
 '[{"county":"San Bernardino"},{"county":"Riverside"}]','[]',
 '[{"id":"ft","fact":"first_time","op":"==","value":true,"msg":"be a first-time buyer"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"},{"id":"edu","fact":"education","op":"==","value":true,"msg":"finish homebuyer education","fixable":true},{"id":"inc","fact":"income","op":"<=","value":{"table":"ie_120ami","by":"size"},"msg":"earn under ~120% of area median income"}]',
 '{"type":"deferred_second","amount_rule":"up_to_40000"}',
 '{"layer":"primary_dpa","conflicts_with":[]}',
 'Up to $40,000 at 0% interest, deferred 30 years, across the Inland Empire.','2026-06-01');

select seed_program('ontario-hb','Ontario Homebuyer Assistance (CHDO)','City of Ontario / NPHS','nonprofit','active_verify',
 '[{"city":"Ontario","county":"San Bernardino"}]','[]',
 '[{"id":"ft","fact":"first_time","op":"==","value":true,"msg":"be a first-time buyer"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"},{"id":"edu","fact":"education","op":"==","value":true,"msg":"finish homebuyer education","fixable":true},{"id":"inc","fact":"income","op":"<=","value":{"table":"ie_80ami","by":"size"},"msg":"meet the city income limits"}]',
 '{"type":"deferred_second","amount_rule":"up_to_60000"}',
 '{"layer":"primary_dpa","conflicts_with":[]}',
 'Down-payment help for buyers purchasing in Ontario.','2026-03-01');

select seed_program('sd-city-low','SDHC First-Time Homebuyer','San Diego Housing Commission','government','active',
 '[{"city":"San Diego","county":"San Diego"}]','[]',
 '[{"id":"ft","fact":"first_time","op":"==","value":true,"msg":"be a first-time buyer"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"},{"id":"edu","fact":"education","op":"==","value":true,"msg":"finish homebuyer education","fixable":true},{"id":"own","fact":"own_funds_pct","op":">=","value":0.03,"msg":"contribute 3% of your own funds","fixable":true},{"id":"inc","fact":"income","op":"<=","value":{"table":"san_diego_80ami","by":"size"},"msg":"meet SDHC income limits"}]',
 '{"type":"deferred_second","amount_rule":"0.19*price"}',
 '{"layer":"primary_dpa","conflicts_with":["sd-afs"]}',
 'Up to 19% of the price plus a $10,000 closing-cost grant in the City of San Diego.','2026-06-01');

select seed_program('sd-dcca','County of San Diego DCCA','County of San Diego','government','active',
 '[{"county":"San Diego"}]','[{"city":"San Diego"}]',
 '[{"id":"ft","fact":"first_time","op":"==","value":true,"msg":"be a first-time buyer"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"},{"id":"edu","fact":"education","op":"==","value":true,"msg":"finish homebuyer education","fixable":true},{"id":"own","fact":"own_funds_pct","op":">=","value":0.03,"msg":"contribute 3% of your own funds","fixable":true},{"id":"inc","fact":"income","op":"<=","value":{"table":"san_diego_80ami","by":"size"},"msg":"meet DCCA income limits"}]',
 '{"type":"deferred_second","amount_rule":"0.22*price"}',
 '{"layer":"primary_dpa","conflicts_with":[]}',
 'Up to 22% of the price plus closing help outside the City of San Diego.','2026-06-01');

select seed_program('sd-afs','SDHC Affordable For-Sale Home','San Diego Housing Commission','government','active_verify',
 '[{"county":"San Diego"}]','[]',
 '[{"id":"ft","fact":"first_time","op":"==","value":true,"msg":"be a first-time buyer"},{"id":"prim","fact":"occupancy","op":"==","value":"primary","msg":"primary residence"},{"id":"edu","fact":"education","op":"==","value":true,"msg":"finish homebuyer education","fixable":true},{"id":"inc","fact":"income","op":"<=","value":{"ami_pct":120,"table":"county_ami_100","by":"size"},"msg":"earn under ~120% of area median income"}]',
 '{"type":"bmr_ownership"}','{"layer":"bmr","conflicts_with":["sd-city-low"]}',
 'Buy a deed-restricted home at a below-market price. Limited inventory.','2026-05-01');

drop function seed_program(text,text,text,text,text,jsonb,jsonb,jsonb,jsonb,jsonb,text,date);

-- ---------- sample listings (pilot inventory; production syncs MLS + BMR feeds)
insert into listings (address, city, county, price, market_value, beds, baths, sqft, flag, bmr, note) values
('3125 Juniper St #4','San Diego','San Diego',355000,615000,2,1,940,'bmr','{"income_table":"san_diego_120ami"}','Deed-restricted condo, resale-capped'),
('7042 Mission Gorge Rd #118','San Diego','San Diego',410000,690000,3,2,1180,'bmr','{"income_table":"san_diego_120ami"}','Deed-restricted, HOA includes water'),
('152 Native Spring','Irvine','Orange',425000,815000,2,2,1050,'bmr','{"income_table":"orange_80ami"}','Irvine Community Land Trust home'),
('1436 W 84th Pl','Los Angeles','Los Angeles',545000,null,3,1,1120,'standard',null,'Priced under LA median — LIPA-eligible zone'),
('6211 Cherry Ave','Long Beach','Los Angeles',585000,null,2,1,900,'standard',null,'Starter bungalow near transit'),
('2814 Mary St','Riverside','Riverside',465000,null,3,2,1350,'standard',null,'Inside city limits — HomeStarter eligible'),
('24610 Eucalyptus Ave','Moreno Valley','Riverside',435000,null,4,2,1500,'standard',null,'FHA-friendly, large lot'),
('1577 N Lilac Ave','Ontario','San Bernardino',470000,null,3,2,1280,'standard',null,'Eligible for Ontario CHDO assistance'),
('875 S Shaffer St','Santa Ana','Orange',620000,null,3,2,1210,'standard',null,'Santa Ana DPA-eligible area'),
('3420 E Avalon St','San Bernardino','San Bernardino',395000,null,3,1,1090,'standard',null,'Below IE median price'),
('1208 Hemlock Ave','Chula Vista','San Diego',610000,null,3,2,1300,'standard',null,'DCCA-eligible (outside City of SD)'),
('44 Bright Meadow','Fontana','San Bernardino',489000,null,3,2.5,1420,'new_construction',null,'Builder credits available for closing costs');
